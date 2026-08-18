import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { chromium } from 'playwright';

// Cargar ubigeo-peru de forma segura para CommonJS
const ubigeos = require('ubigeo-peru');

const cleanText = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
};

const DEPARTAMENTOS = Array.from(
  new Set(
    ubigeos.inei
      .filter((u: any) => u.provincia === '00' && u.distrito === '00')
      .map((u: any) => cleanText(u.nombre)),
  ),
) as string[];
DEPARTAMENTOS.sort((a, b) => b.length - a.length);

const findUbigeo = (depName: string, provName: string, distName: string) => {
  depName = cleanText(depName);
  provName = cleanText(provName);
  distName = cleanText(distName);

  const inei = ubigeos.inei;
  const dep = inei.find(
    (u: any) =>
      u.provincia === '00' &&
      u.distrito === '00' &&
      cleanText(u.nombre) === depName,
  );
  if (!dep) return null;

  const prov = inei.find(
    (u: any) =>
      u.departamento === dep.departamento &&
      u.distrito === '00' &&
      u.provincia !== '00' &&
      cleanText(u.nombre) === provName,
  );
  if (!prov) return null;

  const dist = inei.find(
    (u: any) =>
      u.departamento === dep.departamento &&
      u.provincia === prov.provincia &&
      u.distrito !== '00' &&
      cleanText(u.nombre) === distName,
  );
  if (!dist) return null;

  const ubigeo_sunat = `${dist.departamento}${dist.provincia}${dist.distrito}`;
  const ubigeo = [
    dist.departamento,
    `${dist.departamento}${dist.provincia}`,
    ubigeo_sunat,
  ];
  return { ubigeo_sunat, ubigeo };
};

@Injectable()
export class ConsultasService {
  async consultarDni(dni: string) {
    if (!/^\d{8}$/.test(dni)) {
      throw new BadRequestException(
        'El DNI debe contener exactamente 8 dígitos.',
      );
    }

    try {
      const url = `https://consulta-dni.olvacourier.com/dni/${dni}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Olva API status: ${response.status}`);
      }

      // Olva Courier puede devolver codificación ISO-8859-1 en nombres con tildes o Ñ.
      // Para evitar caracteres rotos (como ), leemos como ArrayBuffer y decodificamos.
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || '';
      let text = '';
      if (
        contentType.toLowerCase().includes('iso-8859-1') ||
        contentType.toLowerCase().includes('latin1')
      ) {
        const decoder = new TextDecoder('iso-8859-1');
        text = decoder.decode(buffer);
      } else {
        const decoder = new TextDecoder('utf-8');
        text = decoder.decode(buffer);
      }

      const result = JSON.parse(text);
      if (!result.success) {
        throw new Error(result.message || 'No se encontraron datos.');
      }

      return {
        success: true,
        data: {
          dni: result.data.dni,
          nombres: result.data.nombres?.trim(),
          apellidoPaterno: result.data.apellidoPaterno?.trim(),
          apellidoMaterno: result.data.apellidoMaterno?.trim(),
          codVerifica: result.data.codVerifica,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error al consultar el DNI.',
        error: error.message,
      });
    }
  }

  async consultarRuc(ruc: string) {
    if (!/^\d{11}$/.test(ruc)) {
      throw new BadRequestException(
        'El RUC debe contener exactamente 11 dígitos.',
      );
    }

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      await page.goto(
        'https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp',
      );
      await page.getByRole('textbox', { name: 'Ingrese RUC' }).fill(ruc);
      await page.getByRole('button', { name: 'Buscar' }).click();

      // Esperar que cargue la página de resultados
      await page.waitForSelector('h4:has-text("Número de RUC:")', {
        timeout: 10000,
      });

      const data = await page.evaluate(() => {
        const getTextByHeading = (text: string) => {
          const headings = Array.from(document.querySelectorAll('h4'));
          const heading = headings.find((h) => h.textContent?.includes(text));
          if (heading) {
            const row = heading.closest('.row');
            if (row) {
              const p = row.querySelector('p');
              if (p) return p.textContent?.trim() || '';
            }
          }
          return '';
        };

        const headings = Array.from(document.querySelectorAll('h4'));
        const rucHeading = headings.find((h) =>
          h.textContent?.match(/^\d{11}\s+-/),
        );
        let rucNum = '';
        let razonSocial = '';
        if (rucHeading && rucHeading.textContent) {
          const parts = rucHeading.textContent.trim().split(' - ');
          rucNum = parts[0].trim();
          razonSocial = parts.slice(1).join(' - ').trim();
        }

        const estado = getTextByHeading('Estado del Contribuyente:');
        const condicion = getTextByHeading('Condición del Contribuyente:');
        const dirCompleta = getTextByHeading('Domicilio Fiscal:');

        let es_buen_contribuyente = 'NO';
        let es_agente_de_retencion = 'NO';
        let es_agente_de_percepcion = 'NO';

        const tds = Array.from(document.querySelectorAll('td'));
        tds.forEach((td) => {
          const text = td.textContent?.toUpperCase() || '';
          if (text.includes('BUENOS CONTRIBUYENTES'))
            es_buen_contribuyente = 'SI';
          if (text.includes('RETENCIÓN')) es_agente_de_retencion = 'SI';
          if (text.includes('PERCEPCIÓN')) es_agente_de_percepcion = 'SI';
        });

        return {
          ruc: rucNum,
          nombre_o_razon_social: razonSocial,
          estado,
          condicion,
          direccion_completa: dirCompleta
            ? dirCompleta.replace(/\s+/g, ' ')
            : '',
          es_buen_contribuyente,
          es_agente_de_retencion,
          es_agente_de_percepcion,
        };
      });

      const parsedAddress = {
        departamento: '',
        provincia: '',
        distrito: '',
        direccion: '',
        ubigeo_sunat: '',
        ubigeo: [] as string[],
      };

      if (data.direccion_completa) {
        const parts = data.direccion_completa.split('-');
        if (parts.length >= 3) {
          const distrito = parts[parts.length - 1].trim();
          const provincia = parts[parts.length - 2].trim();
          const rem = parts.slice(0, parts.length - 2).join('-');
          const textCleaned = cleanText(rem);

          let matchedDep = '';
          for (const dep of DEPARTAMENTOS) {
            if (textCleaned.endsWith(' ' + dep) || textCleaned === dep) {
              matchedDep = dep;
              break;
            }
          }

          if (matchedDep) {
            parsedAddress.departamento = matchedDep;
            parsedAddress.direccion = rem
              .substring(0, textCleaned.lastIndexOf(matchedDep))
              .trim()
              .replace(/\s+/g, ' ');
          } else {
            parsedAddress.direccion = rem.trim();
          }

          parsedAddress.provincia = provincia;
          parsedAddress.distrito = distrito;

          const u = findUbigeo(
            parsedAddress.departamento || '',
            parsedAddress.provincia,
            parsedAddress.distrito,
          );
          if (u) {
            parsedAddress.ubigeo_sunat = u.ubigeo_sunat;
            parsedAddress.ubigeo = u.ubigeo;
          }
        } else {
          parsedAddress.direccion = data.direccion_completa;
        }
      }

      return {
        success: true,
        message: 'exito',
        data: {
          ...data,
          ...parsedAddress,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error al consultar el RUC en SUNAT.',
        error: error.message,
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
