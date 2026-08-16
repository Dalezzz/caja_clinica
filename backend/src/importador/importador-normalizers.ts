export function cleanName(name: string): string {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
}

export function cleanDoctorName(name: string): string {
  if (!name) return '';
  let clean = name.trim().replace(/\s+/g, ' ');
  clean = clean.replace(/^(Dr\.|Dra\.|Dr|Dra)\s+/i, '');
  return clean.trim();
}

export function standardizeSpecialty(esp: string): string {
  if (!esp) return 'Medicina General';

  const norm = esp.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');
  const map: Record<string, string> = {
    'MEDICINA GENERAL': 'Medicina General',
    GINECOLOGIA: 'Ginecología',
    RADIOLOGIA: 'Radiología',
    CARDIOLOGIA: 'Cardiología',
    OFTALMOLOGIA: 'Oftalmología',
    TRAUMATOLOGIA: 'Traumatología',
    PEDIATRIA: 'Pediatría',
    ODONTOLOGIA: 'Odontología',
    PSICOLOGIA: 'Psicología',
    NUTRICION: 'Nutrición',
    ENFERMERIA: 'Enfermería',
    ANESTESISTA: 'Anestesista',
    CIRUGIA: 'Cirugía',
    SOP: 'SOP',
    CERTIFICADOS: 'Certificados',
    ADMINISTRACION: 'Administración',
  };

  return map[norm] || esp.trim().replace(/\s+/g, ' ');
}

export function standardizeCategory(cat: string): string {
  if (!cat) return 'Consulta';

  const norm = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');
  const map: Record<string, string> = {
    CONSULTA: 'Consulta',
    'ECOGRAFIA': 'Ecografía',
    'ECOGRAFIA/S': 'Ecografía',
    ECOGRAFIAS: 'Ecografía',
    'RAYOS X': 'Rayos X',
    RAYOS: 'Rayos X',
    CERTIFICADO: 'Certificado',
    SERVICIOS: 'Servicios',
    SOP: 'SOP',
    HISTORIA: 'Historia',
    DIETAS: 'Dietas',
  };

  return map[norm] || cat.trim().replace(/\s+/g, ' ');
}
