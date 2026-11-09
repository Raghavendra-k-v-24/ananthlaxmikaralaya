// Where booking enquiries are sent: the API in ../server. Set VITE_ENQUIRY_ENDPOINT
// in .env (local) or in the Vercel project settings, e.g.
//   https://api.ananthlaxmikaralaya.com/api/enquiries
const ENDPOINT = import.meta.env.VITE_ENQUIRY_ENDPOINT;

export class EnquiryNotConfiguredError extends Error {
  constructor() {
    super("VITE_ENQUIRY_ENDPOINT is not set");
    this.name = "EnquiryNotConfiguredError";
  }
}

export async function submitEnquiry(payload) {
  if (!ENDPOINT) {
    if (import.meta.env.DEV) {
      // Lets the form be tried locally. Nothing is sent anywhere.
      console.warn("[enquiry] VITE_ENQUIRY_ENDPOINT not set, enquiry NOT sent:", payload);
      await new Promise((resolve) => setTimeout(resolve, 700));
      return;
    }
    throw new EnquiryNotConfiguredError();
  }

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    err.status = 0; // offline or the server couldn't be reached
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`Enquiry failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }
}
