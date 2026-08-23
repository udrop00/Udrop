import {NextResponse} from 'next/server';
import {products} from '../../products';
export const runtime='nodejs';
export async function GET(){return NextResponse.json({products},{headers:{'Cache-Control':'no-store'}})}
