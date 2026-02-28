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
      return NextResponse.json({ error: 'প্রম্পট দে রে মাগি/গান্ডু!' }, { status: 400 });
    }

    // সঠিক Pony Diffusion V6 XL মডেল ID (Replicate-এ কাজ করে)
    const modelVersion = 'ostris/pony-diffusion-v6-xl';

    // আরো খারাপ + Pony-optimized প্রম্পট
    const fullPrompt = `${prompt}, score_9, score_8_up, score_7_up, source_pony, masterpiece, best quality, ultra detailed, hardcore explicit nsfw porn, 1girl 1boy sex scene, massive bouncing tits hard leaking nipples dripping milk cum, wet gaping pussy stretched wide by huge veiny throbbing cock deep creampie overflowing leaking cum, round ass spread tight asshole anal filled thick cum, ahegao face eyes rolled tongue out drooling saliva strings, male muscular sweat covered abs grunting cumshot, thick white cum squirting flooding pussy ass face tits, female squirting gushing juice, sweat saliva mess, extreme closeup penetration internal stretch cock walls folds pubes veins detailed, double penetration possible, bukkake if group, 8k sharp focus no censor no blur`;

    const negativePrompt = 'blurry, lowres, bad anatomy, deformed, ugly, child, underage, text, watermark, censored, safe, clothed, cartoon, artifact, low quality, mutated hands, extra limbs, score_6, score_5, score_4';

    const output = await replicate.run(modelVersion, {
      input: {
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        num_inference_steps: 40,
        guidance_scale: 7.5,
        aspect_ratio: '16:9',
        output_format: 'png',
        output_quality: 95,
      },
    });

    const imageUrl = Array.isArray(output) ? output[0] : (output as string);

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed রে! API key বা মডেল চেক কর 😏' }, { status: 500 });
  }
}
