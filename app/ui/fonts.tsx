// app/ui/fonts.ts
import { Lusitana } from 'next/font/google'
import { Inter } from 'next/font/google'

export const lusitana = Lusitana({
  subsets: ['latin'],
  weight: ['400', '700'], // available weights
})

export const inter = Inter({subsets:['latin']});
