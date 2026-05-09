import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();
const { cedula, tipo_documento = 'cc' } = input;

if (!cedula) {
    throw new Error('Se requiere el número de cédula');
}

const tipoMap = {
    'cc': 'Cédula de Ciudadanía',
    'ce': 'Cédula de Extranjería',
    'nit': 'NIT',
    'pep': 'Permiso Especial de Permanencia',
    'ppt': 'Permiso por Protección Temporal',
};

const results = [];

const crawler = new PlaywrightCrawler({
    launchContext: {
        launchOptions: {
            headless: true,
        },
    },
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 60,
    async requestHandler({ page, log }) {
        log.info(`Consultando Procuraduría para cédula: ${cedula}`);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Select document type
        const tipoSelect = page.locator('select').first();
        if (await tipoSelect.count() > 0) {
            const optionText = tipoMap[tipo_documento] || tipoMap['cc'];
            try {
                await tipoSelect.selectOption({ label: optionText });
            } catch {
                // Try by partial text match
                const options = await tipoSelect.locator('option').allTextContents();
                const match = options.find(o => o.toLowerCase().includes('ciudadan'));
                if (match) await tipoSelect.selectOption({ label: match });
            }
        }

        // Fill cedula number
        const inputs = page.locator('input[type="text"]');
        const inputCount = await inputs.count();
        let cedulaFilled = false;

        for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            const name = await input.getAttribute('name') || '';
            const id = await input.getAttribute('id') || '';
            const isVisible = await input.isVisible();

            if (!isVisible) continue;

            // Find the cedula input (usually the first visible text input after the select)
            if (!cedulaFilled && (name.toLowerCase().includes('numero') || name.toLowerCase().includes('ident') || id.toLowerCase().includes('numero') || id.toLowerCase().includes('ident'))) {
                await input.fill(cedula);
                cedulaFilled = true;
                log.info('Cédula ingresada en campo de identificación');
            }
        }

        // If we couldn't find by name, fill the first visible text input
        if (!cedulaFilled) {
            for (let i = 0; i < inputCount; i++) {
                const input = inputs.nth(i);
                const isVisible = await input.isVisible();
                const type = await input.getAttribute('type') || 'text';
                if (isVisible && type === 'text') {
                    await input.fill(cedula);
                    cedulaFilled = true;
                    log.info('Cédula ingresada en primer campo de texto visible');
                    break;
                }
            }
        }

        // Solve math CAPTCHA
        const pageText = await page.textContent('body');
        const mathMatch = pageText.match(/cu[aá]nto\s+es\s+(\d+)\s*[\+\-\*x×]\s*(\d+)/i)
            || pageText.match(/(\d+)\s*[\+\-\*x×]\s*(\d+)\s*[=\?]/i);

        if (mathMatch) {
            const num1 = parseInt(mathMatch[1]);
            const operator = pageText.match(/(\d+)\s*([\+\-\*x×])\s*(\d+)/);
            let op = '+';
            if (operator) op = operator[2];

            let answer;
            switch (op) {
                case '+': answer = num1 + parseInt(mathMatch[2]); break;
                case '-': answer = num1 - parseInt(mathMatch[2]); break;
                case '*': case 'x': case '×': answer = num1 * parseInt(mathMatch[2]); break;
                default: answer = num1 + parseInt(mathMatch[2]);
            }

            log.info(`CAPTCHA matemático detectado: ${num1} ${op} ${mathMatch[2]} = ${answer}`);

            // Find the CAPTCHA answer input
            const allInputs = page.locator('input[type="text"]');
            const count = await allInputs.count();
            for (let i = count - 1; i >= 0; i--) {
                const input = allInputs.nth(i);
                const isVisible = await input.isVisible();
                const value = await input.inputValue();
                if (isVisible && value === '') {
                    await input.fill(answer.toString());
                    log.info('Respuesta del CAPTCHA ingresada');
                    break;
                }
            }
        }

        // Select certificate type (Ordinario)
        const radioButtons = page.locator('input[type="radio"]');
        const radioCount = await radioButtons.count();
        if (radioCount > 0) {
            await radioButtons.first().check();
        }

        // Click search/submit button
        const buttons = page.locator('input[type="submit"], input[type="button"], button[type="submit"], button');
        const btnCount = await buttons.count();
        for (let i = 0; i < btnCount; i++) {
            const btn = buttons.nth(i);
            const text = (await btn.textContent() || '').toLowerCase();
            const value = (await btn.getAttribute('value') || '').toLowerCase();
            const isVisible = await btn.isVisible();
            if (isVisible && (text.includes('consult') || text.includes('buscar') || text.includes('generar') || value.includes('consult') || value.includes('buscar'))) {
                await btn.click();
                log.info('Botón de consulta clickeado');
                break;
            }
        }

        // Wait for results
        await page.waitForTimeout(5000);
        await page.waitForLoadState('networkidle');

        // Check for results
        const resultText = await page.textContent('body');
        const hasAntecedentes = resultText.toLowerCase().includes('registra antecedentes')
            || resultText.toLowerCase().includes('sí registra')
            || resultText.toLowerCase().includes('si registra');
        const noAntecedentes = resultText.toLowerCase().includes('no registra antecedentes')
            || resultText.toLowerCase().includes('no aparece registrado')
            || resultText.toLowerCase().includes('no se encontr');

        const result = {
            cedula,
            fecha_consulta: new Date().toISOString(),
            tiene_antecedentes: hasAntecedentes && !noAntecedentes,
            texto_resultado: '',
            registros: [],
        };

        if (noAntecedentes) {
            result.texto_resultado = 'No registra antecedentes disciplinarios';
        } else if (hasAntecedentes) {
            result.texto_resultado = 'Registra antecedentes disciplinarios';

            // Try to extract details from tables
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
                            tipo_sancion: cellTexts[0] || 'N/A',
                            estado: cellTexts[1] || 'N/A',
                            entidad: cellTexts[2] || 'N/A',
                            detalle: cellTexts.join(' | '),
                        });
                    }
                }
            }
        } else {
            // Couldn't determine result clearly
            const snippet = resultText.substring(0, 500).replace(/\s+/g, ' ').trim();
            result.texto_resultado = `Resultado no determinado. Fragmento: ${snippet}`;
        }

        results.push(result);
        log.info(`Resultado: ${result.texto_resultado}`);
    },
});

await crawler.run([{
    url: 'https://apps.procuraduria.gov.co/webcert/inicio.aspx?tpo=2',
}]);

await Actor.pushData(results);
await Actor.exit();
