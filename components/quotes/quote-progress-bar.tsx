type QuoteStatus =
  | "not_started"
  | "intake"
  | "underwriting"
  | "proposal_ready"
  | "presented"
  | "accepted"
  | "declined";

const STAGES: { key: QuoteStatus; label: string }[] = [
  { key: "not_started", label: "Not Started" },
  { key: "intake", label: "Intake" },
  { key: "underwriting", label: "Underwriting" },
  { key: "proposal_ready", label: "Proposal" },
  { key: "presented", label: "Presented" },
];

const STATUS_ORDER: Record<QuoteStatus, number> = {
  not_started: 0,
  intake: 1,
  underwriting: 2,
  proposal_ready: 3,
  presented: 4,
  accepted: 5,
  declined: 5,
};

type QuoteProgressBarProps = {
  status: QuoteStatus;
};

function getDotClassName(
  isAccepted: boolean,
  isDeclined: boolean,
  isCompleted: boolean,
  isCurrent: boolean
) {
  if (isAccepted) {
    return "bg-green-500";
  }
  if (isDeclined) {
    return "bg-amber-500";
  }
  if (isCompleted) {
    return "bg-primary";
  }
  if (isCurrent) {
    return "bg-highlight ring-2 ring-highlight/50";
  }
  return "bg-gray-200";
}

export function QuoteProgressBar({ status }: QuoteProgressBarProps) {
  const currentIndex = STATUS_ORDER[status];
  const isTerminal = status === "accepted" || status === "declined";

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, index) => {
        const isCompleted = currentIndex > index;
        const isCurrent = currentIndex === index && !isTerminal;
        const isAccepted =
          isTerminal && status === "accepted" && index === STAGES.length - 1;
        const isDeclined =
          isTerminal && status === "declined" && index === STAGES.length - 1;
        const dotClassName = getDotClassName(
          isAccepted,
          isDeclined,
          isCompleted,
          isCurrent
        );

        return (
          <div className="flex items-center" key={stage.key}>
            <div
              className={`h-2.5 w-2.5 rounded-full ${dotClassName}`}
              title={stage.label}
            />
            {index < STAGES.length - 1 && (
              <div
                className={`h-0.5 w-4 ${
                  currentIndex > index ? "bg-primary" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
