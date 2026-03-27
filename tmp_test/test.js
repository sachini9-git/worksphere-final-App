import fetch from 'node-fetch';

async function test() {
    try {
        const res = await fetch('http://localhost:4000/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: 'Test content to summarize' })
        });
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Response:', text);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
