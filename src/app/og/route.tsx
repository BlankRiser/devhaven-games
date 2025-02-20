import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const postTitle = searchParams.get('title');

  const geistSansFont = fetch(new URL('https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-500-normal.ttf', import.meta.url)).then((res) => res.arrayBuffer());
  const geistMonoFont = fetch(new URL('https://cdn.jsdelivr.net/fontsource/fonts/geist-mono@latest/latin-400-normal.ttf', import.meta.url)).then((res) => res.arrayBuffer());
  const geistSansFontData = await geistSansFont;
  const geistMonoFontData = await geistMonoFont;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          backgroundColor: 'black',
          padding: '48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100vw',
              height: '100%',
              fontSize: 120,
              fontFamily: 'Geist Sans',
              color: 'white',
              textTransform: 'capitalize',
            }}
          >
            {postTitle ?? 'Games'}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            width: '100%',
            gap: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              margin: '0px auto',
              border: '4px solid #171717',
              borderRadius: '4px',
            }}
          ></div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '0px 8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: 'Geist Sans',
                color: 'white',
                fontSize: 40,
              }}
            >
              Ram Shankar Choudhary
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: 'Geist Sans',
                color: 'white',
                fontSize: 40,
              }}
            >
              ram.codes
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1920,
      height: 1080,
      fonts: [
        {
          name: 'Geist Sans',
          data: geistSansFontData,
          style: 'normal',
        },
        {
          name: 'Geist Mono',
          data: geistMonoFontData,
          style: 'normal',
        },
      ],
    },
  );
}
