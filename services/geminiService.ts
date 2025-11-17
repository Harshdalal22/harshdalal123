import { GoogleGenAI, Type } from "@google/genai";
import { LorryReceipt } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const partyDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        address: { type: Type.STRING },
        city: { type: Type.STRING },
        contact: { type: Type.STRING },
        pan: { type: Type.STRING },
        gst: { type: Type.STRING },
    },
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        consignor: partyDetailsSchema,
        consignee: partyDetailsSchema,
        billingTo: partyDetailsSchema,
        invoiceNo: { type: Type.STRING, description: "A suggested invoice number, potentially following a pattern from previous LRs." },
        remark: { type: Type.STRING, description: "A relevant remark for the shipment." },
    },
};

export const suggestLRDetails = async (
    currentLR: LorryReceipt,
    existingLRs: LorryReceipt[]
): Promise<Partial<LorryReceipt> | null> => {
    try {
        // Use a concise and recent set of examples for the model
        const examples = existingLRs.slice(0, 10).map(({ lrNo, truckNo, fromPlace, toPlace, consignor, consignee, invoiceNo, remark }) => 
            ({ lrNo, truckNo, fromPlace, toPlace, consignor: { name: consignor.name, address: consignor.address }, consignee: { name: consignee.name, address: consignee.address }, invoiceNo, remark })
        );

        const prompt = `
            You are an intelligent assistant for a logistics company helping fill out a Lorry Receipt (LR) form.
            Based on the provided list of previous LRs for context and a new, partially filled LR, your task is to predict and suggest values for the *empty* fields in the new LR.

            Context of previous LRs (up to 10 most recent):
            ${JSON.stringify(examples, null, 2)}

            New, partially filled LR:
            ${JSON.stringify(currentLR, null, 2)}
            
            Please analyze the patterns. For example:
            - If a specific truck number frequently travels between the same 'from' and 'to' places for the same companies, suggest those consignor and consignee details.
            - If invoice numbers follow a sequence or pattern, suggest the next logical one.
            - Suggest common remarks for similar shipments.

            Return your suggestions as a JSON object adhering to the provided schema. Only include fields for which you have a confident suggestion. Do not suggest values for fields that are already filled in the new LR.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema,
            },
        });

        const text = response.text.trim();
        if (text) {
            return JSON.parse(text) as Partial<LorryReceipt>;
        }
        return null;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return null;
    }
};
