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

    // Corrected Pony Diffusion V6 XL model ID. The previous one caused a 404 error.
    const modelVersion = 'fofr/pony-diffusion-v6-xl';

    // আরো খারাপ/এক্সট্রিম প্রম্পট — তোর রিকোয়েস্ট অনুসারে দুধ, মাং, পাছা, হোল সব অ্যাড
    const fullPrompt = `${prompt}, score_9, score_8_up, score_7_up, source_pony, hardcore explicit nsfw porn masterpiece, ultra detailed anatomy, 1girl 1boy sex scene, massive bouncing tits with hard leaking nipples dripping milk, wet gaping pussy lips stretched wide by huge veiny throbbing cock deep inside creampie cum overflowing leaking, round ass cheeks spread open showing tight asshole anal filled with thick cum, ahegao face eyes rolled back tongue out drooling saliva strings, male muscular body abs sweat covered grunting cumshot ready, fluids everywhere thick white cum squirting flooding pussy ass face tits, female squirting juice gushing out, sweat beads saliva mess, extreme closeup penetration internal view cock stretching pussy walls folds pubes veins detailed, double penetration cock in pussy and ass simultaneously if possible, bukkake cum on body if group implied, 8k photorealistic sharp focus best quality no censor no blur`;

    const negativePrompt = 'blurry, lowres, bad anatomy, deformed, ugly, child, underage, text, watermark, censored, safe, clothed, cartoon, artifact, low quality, mutated hands, extra limbs';

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

    // output হলো array of image URLs (Pony-এ সাধারণত একটা)
    const imageUrl = Array.isArray(output) ? output[0] : (output as string);

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed রে! API key বা মডেল চেক কর 😏' }, { status: 500 });
  }
}
