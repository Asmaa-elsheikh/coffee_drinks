import { apiRequest } from "./client/src/lib/queryClient";

// Since this is node, we can't use browser fetch easily without polyfills
// But we can use standard fetch in node 18+
async function test() {
    const port = process.env.PORT || 5000;
    try {
        const res = await fetch(`http://localhost:${port}/api/branches`);
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body starts with:", text.substring(0, 100));
    } catch (e: any) {
        console.error("Fetch failed:", e.message);
    }
}

test();
