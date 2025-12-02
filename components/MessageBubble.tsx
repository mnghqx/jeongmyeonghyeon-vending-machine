import type { MessageType } from "../hooks/useVendingMachine";

type MessageBubbleProps = {
  message: string;
  type: MessageType;
};

export function MessageBubble({ message, type }: MessageBubbleProps) {
  const className = `bubble bubble--${type}`;

  const label =
    type === "idle" ? "씨드 자판기" : type === "info" ? "안내" : "오류";

  return (
    <div className={className}>
      <div className="bubble__content">
        <div className="bubble__label">{label}</div>
        <div className="bubble__message">{message}</div>
      </div>
      <div className="bubble__tail" />
    </div>
  );
}
