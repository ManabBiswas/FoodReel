import { createContext } from 'react'

/**
 * Context for partner data
 * Created in a separate file to follow Fast Refresh rule:
 * "Only export components from component files"
 */
export const PartnerDataContext = createContext(null)
