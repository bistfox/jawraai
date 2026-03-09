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

    // Using a specific, version-locked model from Replicate to avoid 404 errors.
    const modelVersion = 'kijiku/juggernaut-xl-v9:e49450a2f46252a1d227b328c31405b6378417d91e604f05b00c3a28c2e6b4ed';

    // Updated prompt for Juggernaut XL
    const fullPrompt = `photorealistic, masterpiece, best quality, ultra detailed, ${prompt}, hardcore explicit nsfw, 1girl 1boy sex scene, massive bouncing tits hard leaking nipples dripping milk cum, wet gaping pussy stretched wide by huge veiny throbbing cock deep creampie overflowing leaking cum, round ass spread tight asshole anal filled thick cum, ahegao face eyes rolled tongue out drooling saliva strings, male muscular sweat covered abs grunting cumshot, thick white cum squirting flooding pussy ass face tits, female squirting gushing juice, sweat saliva mess, extreme closeup penetration internal stretch cock walls folds pubes veins detailed, double penetration possible, bukkake if group, 8k sharp focus no censor no blur`;

    const negativePrompt = 'blurry, lowres, bad anatomy, deformed, ugly, child, underage, text, watermark, censored, safe, clothed, cartoon, artifact, low quality, mutated hands, extra limbs, score_6, score_5, score_4';

    const output = await replicate.run(modelVersion, {
      input: {
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        num_inference_steps: 25,
        guidance_scale: 7.5,
        width: 1024,
        height: 576,
        output_format: 'png'
      },
    });

    const imageUrl = Array.isArray(output) ? output[0] : (output as string);

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed রে! API key বা মডেল চেক কর 😏' }, { status: 500 });
  }
}
