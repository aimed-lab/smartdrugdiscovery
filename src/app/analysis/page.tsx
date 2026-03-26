"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  model: string;
  timestamp: string;
  messageCount: number;
}

const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "ADMET Analysis: Vemurafenib analogs",
    model: "Drug-GPT",
    timestamp: "Today, 2:30 PM",
    messageCount: 8,
  },
  {
    id: "conv-2",
    title: "BRAF V600E target validation",
    model: "BioGPT",
    timestamp: "Yesterday, 4:15 PM",
    messageCount: 12,
  },
  {
    id: "conv-3",
    title: "SAR for JAK2 inhibitor series",
    model: "Claude",
    timestamp: "Mar 23, 11:00 AM",
    messageCount: 6,
  },
  {
    id: "conv-4",
    title: "Literature review: KRAS G12C",
    model: "GPT-4",
    timestamp: "Mar 21, 9:45 AM",
    messageCount: 15,
  },
];

const promptTemplates = [
  {
    name: "ADMET Prediction",
    prompt:
      "Analyze the ADMET properties of the following compound and predict absorption, distribution, metabolism, excretion, and toxicity profiles:",
  },
  {
    name: "Target Validation",
    prompt:
      "Evaluate the following target for druggability, considering protein structure, disease linkage, and existing therapeutic precedent:",
  },
  {
    name: "SAR Analysis",
    prompt:
      "Perform a structure-activity relationship analysis on the following compound series, identifying key pharmacophoric features:",
  },
  {
    name: "Drug-Drug Interaction",
    prompt:
      "Predict potential drug-drug interactions for the following compound, considering CYP450 metabolism and transporter effects:",
  },
  {
    name: "Literature Review",
    prompt:
      "Summarize the latest research findings related to the following target or therapeutic area:",
  },
  {
    name: "Lead Optimization",
    prompt:
      "Suggest structural modifications to optimize the following lead compound for improved potency and drug-like properties:",
  },
];

const contextOptions = {
  Projects: [
    "BRAF Inhibitor Program",
    "Alzheimer's Tau Program",
    "JAK2 Inhibitor Optimization",
  ],
  Compounds: [
    "Vemurafenib (SDD-0012)",
    "Erlotinib (SDD-0034)",
    "Imatinib (SDD-0056)",
  ],
  Targets: ["EGFR", "BRAF V600E", "ALK", "BACE1"],
};

const initialMessages: Message[] = [
  {
    id: "msg-1",
    role: "user",
    content:
      "Analyze the ADMET properties of Vemurafenib (SMILES: CCCS(=O)(=O)Nc1ccc(F)c(C(=O)c2cc[nH]c2C)c1F) and identify any liabilities.",
    timestamp: "2:30 PM",
  },
  {
    id: "msg-2",
    role: "assistant",
    content:
      "ADMET Analysis: Vemurafenib\n\nAbsorption:\n\u2022 MW: 489.92 Da (borderline Ro5)\n\u2022 LogP: 3.6 (moderate lipophilicity)\n\u2022 PSA: ~100 \u00c5\u00b2 (adequate for oral bioavailability)\n\u2022 Predicted oral bioavailability: ~60%\n\nDistribution:\n\u2022 High plasma protein binding (>99%)\n\u2022 Limited CNS penetration (P-gp substrate)\n\nMetabolism:\n\u2022 Primary CYP3A4 substrate\n\u2022 Potential CYP1A2 inhibition\n\u2022 Glucuronidation via UGT1A1\n\nExcretion:\n\u2022 Half-life: ~57 hours\n\u2022 Primarily hepatic elimination\n\nToxicity Flags:\n\u2022 hERG liability: Low risk (IC50 > 30 \u00b5M)\n\u2022 Hepatotoxicity: Moderate risk\n\u2022 Phototoxicity: High risk\n\nKey Liabilities:\n1. Phototoxicity \u2014 sulfonamide + fluorinated aromatic system\n2. High protein binding limits free drug concentration\n3. CYP3A4 dependence creates DDI risk",
    timestamp: "2:31 PM",
  },
  {
    id: "msg-3",
    role: "user",
    content:
      "What structural modifications would reduce the phototoxicity risk?",
    timestamp: "2:33 PM",
  },
  {
    id: "msg-4",
    role: "assistant",
    content:
      "To reduce phototoxicity while maintaining BRAF V600E activity:\n\n1. Replace sulfonamide \u2014 Consider methylsulfonyl or reverse sulfonamide linkage to reduce UV absorption\n\n2. Modify fluorine pattern \u2014 Remove one fluorine from the difluorophenyl ring; mono-fluoro analogs show reduced phototoxic potential\n\n3. Add electron-donating groups \u2014 Methoxy or hydroxyl substituents can shift UV absorption away from the phototoxic window (290-400 nm)\n\n4. Bioisosteric replacement \u2014 Replace the pyrrole with pyrazole to reduce overall conjugation\n\nRecommended priority: Start with sulfonamide replacement (option 1) as it has the best literature precedent for reducing phototoxicity in BRAF inhibitors.",
    timestamp: "2:34 PM",
  },
];

export default function AnalysisPage() {
  const [activeConversation, setActiveConversation] = useState("conv-1");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("Drug-GPT");
  const [selectedContext, setSelectedContext] = useState<string[]>([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content:
          "I'm analyzing your query. In a production environment, this would connect to the selected AI model for real-time analysis. Try one of the prompt templates above for a pre-built analysis example.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleContext = (item: string) => {
    setSelectedContext((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const removeContext = (item: string) => {
    setSelectedContext((prev) => prev.filter((c) => c !== item));
  };

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Left Panel */}
      <div className="w-72 border-r bg-card flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
        </div>
        <button
          className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 mb-4"
          onClick={() => {
            setMessages([]);
            setActiveConversation("");
          }}
        >
          New Chat
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {mockConversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "rounded-md p-3 cursor-pointer hover:bg-accent",
                activeConversation === conv.id && "bg-accent"
              )}
              onClick={() => setActiveConversation(conv.id)}
            >
              <div className="font-medium text-sm truncate">{conv.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {conv.model}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {conv.timestamp}
                </span>
                <span className="text-xs text-muted-foreground">
                  {conv.messageCount} msgs
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="border-b p-3 flex items-center gap-3 flex-wrap relative">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option>Drug-GPT</option>
            <option>MolBERT</option>
            <option>BioGPT</option>
            <option>GPT-4</option>
            <option>Claude</option>
          </select>

          {/* Context Button */}
          <button
            className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
            onClick={() => {
              setShowContextMenu(!showContextMenu);
              setShowTemplates(false);
            }}
          >
            Attach Context
            {selectedContext.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-xs">
                {selectedContext.length}
              </span>
            )}
          </button>
          {showContextMenu && (
            <div className="absolute top-full left-0 mt-1 bg-card border rounded-lg shadow-lg p-4 z-20 w-80">
              {Object.entries(contextOptions).map(([section, items]) => (
                <div key={section} className="mb-3 last:mb-0">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    {section}
                  </div>
                  {items.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 py-1 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContext.includes(item)}
                        onChange={() => toggleContext(item)}
                        className="rounded"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Templates Button */}
          <button
            className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
            onClick={() => {
              setShowTemplates(!showTemplates);
              setShowContextMenu(false);
            }}
          >
            Templates
          </button>
          {showTemplates && (
            <div className="absolute top-full mt-1 bg-card border rounded-lg shadow-lg p-4 z-20 w-96">
              <div className="grid grid-cols-2 gap-2">
                {promptTemplates.map((template) => (
                  <div
                    key={template.name}
                    className="p-3 rounded-md border hover:bg-accent cursor-pointer"
                    onClick={() => {
                      setInputValue(template.prompt);
                      setShowTemplates(false);
                    }}
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.prompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 max-w-[70%]">
                  {message.content}
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex justify-start">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Drug-GPT
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 max-w-[70%] whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            )
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t p-4">
          {selectedContext.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedContext.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs"
                >
                  {item}
                  <button
                    onClick={() => removeContext(item)}
                    className="hover:text-destructive"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end">
            <textarea
              className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
              placeholder="Ask about compounds, targets, or drug discovery..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="rounded-lg bg-primary text-primary-foreground px-4 py-3 hover:bg-primary/90 disabled:opacity-50 ml-2"
              disabled={!inputValue.trim()}
              onClick={handleSend}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
