import moment from 'moment';

export const calculateAge = (dateOfBirth: Date) => moment().diff(moment(dateOfBirth), 'years');
