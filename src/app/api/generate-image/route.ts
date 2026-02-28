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

    const fullPrompt = `${prompt}, hyper realistic hardcore nsfw explicit porn scene, detailed female body: massive bouncing tits with hard nipples dripping milk, wet gaping pussy lips stretched wide with cum leaking, round ass cheeks spread open showing tight asshole filled with lube, female ahegao face eyes rolled back tongue out drooling saliva, detailed male body: huge veiny throbbing cock balls deep in pussy/ass/mouth, muscular abs covered in sweat, male grunting face with cumshot ready, fluids everywhere: thick white cum squirting from cock flooding pussy/ass/face/tits, female squirting juice gushing out, sweat beads on skin, saliva strings from mouth fuck, blood-red lighting dim room messy bed stained with fluids, extreme closeup on penetration with internal view of cock stretching walls, double penetration if possible cock in pussy and ass simultaneously, group if implied multiple cocks bukkake cum on body, ultra detailed textures veins on cock folds in pussy hair on pubes, 8k photorealistic masterpiece best quality sharp focus no censor no blur --ar 16:9 --stylize 0 --v 6 --no safe_filter`;
    const negativePrompt = "censored, blurred, low quality, deformed, ugly, child, underage, non-explicit, clothing, safe, cartoonish, watermark, text, artifacts";


    // Flux uncensored/NSFW-friendly মডেল (black-forest-labs/flux-dev বা flux-schnell)
    const output = await replicate.run(
      'black-forest-labs/flux-dev', // অথবা 'black-forest-labs/flux-schnell' ফাস্টারের জন্য
      {
        input: {
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
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
