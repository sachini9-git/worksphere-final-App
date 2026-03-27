import fetch from 'node-fetch';

async function test() {
    const apiKey = 'AIzaSyAqBK6autlcv4RBP7fUz3_XItpz2JUrDLw';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
    });
    console.log('Status:', res.status);
    console.log('Response:', await res.text());
}
test();
