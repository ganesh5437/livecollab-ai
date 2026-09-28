import { Response, NextFunction } from "express";
import { z } from "zod";
import * as aiService from "../services/ai.service";

const askSchema = z.object({ question: z.string().min(1).max(1000) });
const autocompleteSchema = z.object({ context: z.string().max(5000) });

export async function summarize(req: any, res: Response, next: NextFunction) {
  try {
    const summary = await aiService.summarizeDocument(req.params.documentId);
    res.json({ summary });
  } catch (err) {
    next(err);
  }
}

export async function ask(req: any, res: Response, next: NextFunction) {
  try {
    const { question } = askSchema.parse(req.body);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    for await (const event of aiService.answerQuestionStream(req.params.documentId, question)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    next(err);
  }
}

export async function autocomplete(req: any, res: Response, next: NextFunction) {
  try {
    const { context } = autocompleteSchema.parse(req.body);
    const completion = await aiService.autocomplete(req.params.documentId, context);
    res.json({ completion });
  } catch (err) {
    next(err);
  }
}
