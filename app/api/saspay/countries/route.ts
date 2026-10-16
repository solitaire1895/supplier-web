// app/api/saspay/countries/route.ts
//
// Countries the pricing UI can offer, with a suggested default for this visitor.

import { NextResponse } from 'next/server'
import { getPayableCountries, guessCountry } from '@/lib/billing-countries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const countries = await getPayableCountries()
  const suggested = guessCountry(req.headers, countries)

  return NextResponse.json(
    {
      countries: countries.map(({ iso, currency, name }) => ({ iso, currency, name })),
      suggested: suggested.iso,
    },
    { headers: { 'Cache-Control': 'private, max-age=300' } }
  )
}
