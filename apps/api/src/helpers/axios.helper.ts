import axios, { AxiosError } from 'axios';

export default function axiosHelper(fn: Function) {
  try {
    return fn();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      handleAxiosError(error);
    } else {
      handleUnexpectedError(error);
    }
  }
}

function handleAxiosError(error: AxiosError) {
  console.log(error.status, error.response);
}

function handleUnexpectedError(error: unknown) {
  console.error(error);
}
