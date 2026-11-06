import axios from 'axios'
import { axiosConfig } from '../config/Api'

// Module-level SWR fetcher. Keeping it outside components gives SWR a stable function reference, so it can dedupe identical keys across pages.

export const swrFetcher = async (url) => {
  const response = await axios.get(url, axiosConfig)
  return response.data
}
