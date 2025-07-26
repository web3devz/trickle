import { FlagAccordion } from "./flag-table";
import { IncompatibleBrowserAlert } from "./incompatible-alert";
import { ExternalLink } from "../rendering/common/external-link";
import { useState } from "react";
import { CodeSnippet } from "../rendering/common/code-snippet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function Modal({
  error,
  closeModal,
}: {
  error?: any;
  closeModal: () => void;
}) {
  const [selectedAccordionValue, setSelectedSelectedAccordionValue] = useState<
    string | undefined
  >();
  const openInstructions = () => setSelectedSelectedAccordionValue("item-4");
  const showSupportedBrowsers = () =>
    setSelectedSelectedAccordionValue("item-3");

  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent className="h-full sm:h-fit flex flex-col items-center justify-start sm:justify-center gap-4 max-w-2xl overflow-y-scroll">
        <DialogHeader>
          <DialogTitle asChild>
            <h2 className="text-3xl font-bold">Chrome AI Notice</h2>
          </DialogTitle>
          <p className="">
            This chatbot demo (
            <ExternalLink href="https://github.com/nicoalbanese/ai-sdk-chrome-ai">
              source
            </ExternalLink>
            ) uses Next.js and{" "}
            <ExternalLink href="https://sdk.vercel.ai/docs">
              Vercel AI SDK
            </ExternalLink>{" "}
            with the{" "}
            <ExternalLink href="https://github.com/jeasonstudio/chrome-ai">
              chrome-ai
            </ExternalLink>{" "}
            provider to call Chrome&apos;s{" "}
            <ExternalLink href="https://developer.chrome.com/docs/ai/built-in">
              built-in AI
            </ExternalLink>{" "}
            model (Gemini Nano). This is only needed if you want to use Chrome&apos;s
            built-in AI model.
          </p>
          <p>
            Gemini Nano&apos;s Prompt API is exposed on the browser&apos;s
            <CodeSnippet>window.ai</CodeSnippet>function. It can be easily called
            with Vercel AI SDK&apos;s unified API.
          </p>
        </DialogHeader>
        <div className="w-full pt-2 space-y-2">
          {error ? (
            <div>
              <IncompatibleBrowserAlert
                error={error}
                openInstructions={openInstructions}
                showSupportedBrowsers={showSupportedBrowsers}
              />
            </div>
          ) : null}
          <FlagAccordion
            value={selectedAccordionValue}
            setValue={setSelectedSelectedAccordionValue}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}