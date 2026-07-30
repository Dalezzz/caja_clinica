const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');

async function runTest() {
  const prisma = new PrismaClient();
  console.log('Starting automated flow test using Playwright...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to page alerts/dialogs
  page.on('dialog', async dialog => {
    console.log(`[ALERT] Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    // 1. Go to page
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Take screenshot before starting
    await page.screenshot({ path: 'step1_loaded.png' });

    // 2. Click "ABRIR CAJA DE ATENCIÓN"
    const openCajaButton = page.locator('button:has-text("ABRIR CAJA DE ATENCIÓN")');
    if (await openCajaButton.isVisible()) {
      console.log('Clicking ABRIR CAJA DE ATENCIÓN...');
      await openCajaButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('Shift caja seems to be already open.');
    }

    await page.screenshot({ path: 'step2_caja_opened.png' });

    // 3. Fill patient details
    console.log('Filling patient form...');
    // We select the inputs using selectors
    await page.fill('input[placeholder="Número"] >> nth=0', '88887777'); // DNI
    await page.waitForTimeout(1000); // Wait for DNI search (optional)
    await page.fill('input[placeholder="Número"] >> nth=1', '966554433'); // Celular
    await page.fill('input[placeholder="Nombre completo"]', 'Paciente de Prueba Automatizada');
    await page.fill('input[placeholder="Edad"]', '45');
    await page.fill('input[placeholder="N° Historia"]', 'HC-AUTO-01');

    await page.screenshot({ path: 'step3_form_filled.png' });

    // 4. Click Emitir/Imprimir Comprobante
    console.log('Submitting ticket...');
    const submitButton = page.locator('button:has-text("EMITIR E IMPRIMIR COMPROBANTE")');
    await submitButton.click();
    await page.waitForTimeout(3000); // Wait for API response and render

    await page.screenshot({ path: 'step4_submitted.png' });

    // Close the modal to allow clicking on other tabs
    console.log('Closing printable ticket modal...');
    await page.click('button:has-text("Cerrar")');
    await page.waitForTimeout(1000);

    // 5. Verify database persistence
    console.log('Verifying data persistence in PostgreSQL database...');
    const dbPatients = await prisma.paciente.findMany({
      where: { nombre: 'Paciente de Prueba Automatizada' },
      include: { tickets: true }
    });

    if (dbPatients.length > 0) {
      console.log('✅ Success! Patient found in database:');
      console.log(JSON.stringify(dbPatients, null, 2));
      if (dbPatients[0].tickets.length > 0) {
        console.log(`✅ Success! Ticket was successfully registered and linked: Ticket ID ${dbPatients[0].tickets[0].id}`);
      } else {
        console.log('❌ Error: Patient created, but no tickets linked.');
      }
    } else {
      console.log('❌ Error: Patient not found in database.');
    }

    // 6. Close the shift (Go to Arqueo Ciego tab and close)
    console.log('Going to Arqueo Ciego tab to close the shift...');
    await page.click('button:has-text("Arqueo Ciego de Caja")');
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder="0.00"]', '180');
    await page.fill('textarea[placeholder="Notas de billetes en mal estado o vuelto de caja..."]', 'Cierre automático de prueba');
    await page.screenshot({ path: 'step5_arqueo_filled.png' });

    console.log('Clicking close shift button...');
    await page.click('button:has-text("PROCESAR CIERRE DE TURNO Y ARQUEO")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'step6_closed.png' });

    // Verify caja state in DB
    const closedCaja = await prisma.cajaDiaria.findFirst({
      orderBy: { fecha: 'desc' }
    });
    console.log('Latest Caja Diaria in DB state:');
    console.log(`Caja ID: ${closedCaja.id}, Abierta: ${closedCaja.abierta}, Monto Real: ${closedCaja.montoEfectivoReal}, Diferencia: ${closedCaja.diferenciaCierre}`);

  } catch (error) {
    console.error('An error occurred during verification:', error);
  } finally {
    await browser.close();
    await prisma.$disconnect();
    console.log('Test execution complete.');
  }
}

runTest();
