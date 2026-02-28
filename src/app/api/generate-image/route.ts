// app/api/generate-image/route.ts
import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;

    if (!prompt) {
      return NextResponse.json({ error: 'প্রম্পট দে রে!' }, { status: 400 });
    }

    // Flux uncensored/NSFW-friendly মডেল (black-forest-labs/flux-dev বা flux-schnell)
    const output = await replicate.run(
      'black-forest-labs/flux-dev', // অথবা 'black-forest-labs/flux-schnell' ফাস্টারের জন্য
      {
        input: {
          prompt: prompt + ', ultra detailed, nsfw, explicit, hardcore, cum dripping, ahegao face, 8k, masterpiece, best quality',
          num_inference_steps: 30,
          aspect_ratio: '16:9',
          output_format: 'png',
          output_quality: 90,
        },
      }
    );

    // output হলো array of image URLs
    const imageUrl = Array.isArray(output) ? output[0] : output;

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Generation failed রে!' }, { status: 500 });
  }
}
