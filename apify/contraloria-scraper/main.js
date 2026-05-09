import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();
const { cedula, tipo_documento = 'CC', captcha_api_key } = input;

if (!cedula) {
    throw new Error('Se requiere el número de cédula');
}

const TWOCAPTCHA_KEY = captcha_api_key || process.env.TWOCAPTCHA_KEY || '';
const SITE_KEY = '6LcfnjwUAAAAAIyl8ehhox7ZYqLQSVl_w1dmYIle';
const PAGE_URL = 'https://cfiscal.contraloria.gov.co/certificados/certificadopersonanatural.aspx';

async function solve2Captcha(siteKey, pageUrl, apiKey, log) {
    log.info('Enviando reCAPTCHA a 2captcha...');

    const createResp = await fetch(
        `https://2captcha.com/in.php?key=${apiKey}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`
    );
    const createData = await createResp.json();
    if (createData.status !== 1) {
        throw new Error(`2captcha error: ${createData.request}`);
    }

    const captchaId = createData.request;
    log.info(`CAPTCHA enviado, ID: ${captchaId}. Esperando resolución...`);

    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const resultResp = await fetch(
            `https://2captcha.com/res.php?key=${apiKey}&action=get&id=${captchaId}&json=1`
        );
        const resultData = await resultResp.json();

        if (resultData.status === 1) {
            log.info('reCAPTCHA resuelto exitosamente');
            return resultData.request;
        }
        if (resultData.request !== 'CAPCHA_NOT_READY') {
            throw new Error(`2captcha error: ${resultData.request}`);
        }
    }
    throw new Error('Timeout esperando resolución del CAPTCHA');
}

const results = [];

const crawler = new PlaywrightCrawler({
    launchContext: {
        launchOptions: { headless: true },
    },
    maxRequestRetries: 1,
    requestHandlerTimeoutSecs: 180,
    async requestHandler({ page, log }) {
        log.info(`Consultando Contraloría para documento: ${cedula}`);

        await page.waitForLoadState('networkidle');

        // Select document type
        await page.selectOption('#ddlTipoDocumento', tipo_documento);
        log.info(`Tipo documento seleccionado: ${tipo_documento}`);

        // Fill document number
        await page.fill('#txtNumeroDocumento', cedula);
        log.info('Número de documento ingresado');

        // Solve reCAPTCHA
        if (!TWOCAPTCHA_KEY) {
            throw new Error('Se requiere captcha_api_key (2captcha) para resolver el reCAPTCHA');
        }

        const captchaToken = await solve2Captcha(SITE_KEY, PAGE_URL, TWOCAPTCHA_KEY, log);

        // Inject the solved captcha token
        await page.evaluate((token) => {
            document.getElementById('g-recaptcha-response').value = token;
            if (typeof ___grecaptcha_cfg !== 'undefined') {
                const clients = ___grecaptcha_cfg.clients;
                if (clients) {
                    Object.keys(clients).forEach(key => {
                        const client = clients[key];
                        if (client && client.$ && client.$.$ && typeof client.$.$.callback === 'function') {
                            client.$.$.callback(token);
                        }
                    });
                }
            }
        }, captchaToken);

        log.info('Token de reCAPTCHA inyectado');

        // Click search button
        await page.click('#btnBuscar');
        log.info('Botón Buscar clickeado');

        // Wait for response
        await page.waitForTimeout(5000);
        await page.waitForLoadState('networkidle');

        // Check for download or result
        const resultText = await page.textContent('body');

        const esResponsable = resultText.toLowerCase().includes('sí aparece')
            || resultText.toLowerCase().includes('si aparece')
            || resultText.toLowerCase().includes('responsable fiscal')
            && !resultText.toLowerCase().includes('no aparece');

        const noEsResponsable = resultText.toLowerCase().includes('no aparece')
            || resultText.toLowerCase().includes('no se encuentra')
            || resultText.toLowerCase().includes('no figura');

        const result = {
            cedula,
            tipo_documento,
            fecha_consulta: new Date().toISOString(),
            es_responsable_fiscal: esResponsable && !noEsResponsable,
            texto_resultado: '',
            registros: [],
        };

        if (noEsResponsable) {
            result.texto_resultado = 'No aparece como responsable fiscal';
        } else if (esResponsable) {
            result.texto_resultado = 'Aparece como responsable fiscal';

            const tables = page.locator('table');
            const tableCount = await tables.count();
            for (let t = 0; t < tableCount; t++) {
                const rows = tables.nth(t).locator('tr');
                const rowCount = await rows.count();
                for (let r = 1; r < Math.min(rowCount, 10); r++) {
                    const cells = rows.nth(r).locator('td');
                    const cellCount = await cells.count();
                    if (cellCount >= 2) {
                        const cellTexts = [];
                        for (let c = 0; c < cellCount; c++) {
                            cellTexts.push((await cells.nth(c).textContent() || '').trim());
                        }
                        result.registros.push({
                            proceso: cellTexts[0] || 'N/A',
                            monto: cellTexts[1] || 'N/A',
                            estado: cellTexts[2] || 'N/A',
                            detalle: cellTexts.join(' | '),
                        });
                    }
                }
            }
        } else {
            // Try to detect if we got a PDF certificate (good sign = no fiscal responsibility)
            const hasGenerado = resultText.toLowerCase().includes('certificado')
                && resultText.toLowerCase().includes('generad');
            if (hasGenerado) {
                result.texto_resultado = 'Certificado generado — no aparece como responsable fiscal';
                result.es_responsable_fiscal = false;
            } else {
                const snippet = resultText.substring(0, 500).replace(/\s+/g, ' ').trim();
                result.texto_resultado = `Resultado no determinado. Fragmento: ${snippet}`;
            }
        }

        results.push(result);
        log.info(`Resultado: ${result.texto_resultado}`);
    },
});

await crawler.run([{ url: PAGE_URL }]);

await Actor.pushData(results);
await Actor.exit();
