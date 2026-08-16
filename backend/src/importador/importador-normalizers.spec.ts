import { cleanDoctorName, cleanName, standardizeCategory, standardizeSpecialty } from './importador-normalizers';

describe('importador-normalizers', () => {
  it('normalizes names and strips doctor prefixes', () => {
    expect(cleanName('  Ana   María  López  ')).toBe('Ana María López');
    expect(cleanDoctorName('Dr. Juan Pérez')).toBe('Juan Pérez');
    expect(cleanDoctorName('Dra. Ana García')).toBe('Ana García');
  });

  it('standardizes specialties and categories used by imported sheets', () => {
    expect(standardizeSpecialty('ginecologia')).toBe('Ginecología');
    expect(standardizeSpecialty('radiologia')).toBe('Radiología');
    expect(standardizeCategory('ecografias')).toBe('Ecografía');
    expect(standardizeCategory('rayos x')).toBe('Rayos X');
  });
});
