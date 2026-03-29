import { SetMetadata } from '@nestjs/common';

export const DEPARTMENT_ACCESS_KEY = 'departmentAccess';

export const AllowDepartments = (...departments: string[]) =>
  SetMetadata(DEPARTMENT_ACCESS_KEY, departments.map((department) => department.toLowerCase()));
