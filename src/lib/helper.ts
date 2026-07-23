import moment from 'moment';

export const calculateAge = (dateOfBirth: Date) => moment().diff(moment(dateOfBirth), 'years');
export const formatDate = (date: Date) => moment(date).format('YYYY-MM-DD');

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function buildPageItems(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  if (current >= totalPages - 3) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', totalPages];
}
