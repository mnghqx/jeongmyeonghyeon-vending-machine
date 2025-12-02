import { useReducer } from "react";

export type PaymentMethod = "cash" | "card";
export type MessageType = "idle" | "info" | "error";
export type CashKind = "coin" | "bill";
type CardKind = "normal" | "error";

// 1~16 슬롯 번호
export type SlotId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16;

export type DrinkSlot = {
  id: SlotId; // 번호 패드 번호
  code: string; // 표시용 코드
  name: string;
  price: number;
  stock: number;
};

type DispensedItem = {
  id: SlotId;
  name: string;
  count: number;
};

type State = {
  balance: number;
  paymentMethod: PaymentMethod | null;
  slots: DrinkSlot[];
  message: string;
  messageType: MessageType;
  messageId: number; // 메시지 변경 카운터
  dispensed: DispensedItem[]; // 이번에 나온 음료들 누적
  change: number;
  userWallet: number;
  cardBalance: number; // 카드 잔액
};

type Action =
  | { type: "INSERT_CASH"; amount: number; kind: CashKind }
  | { type: "INSERT_CARD"; kind: CardKind }
  | { type: "EJECT_CARD" }
  | { type: "SELECT_SLOT"; id: SlotId }
  | { type: "RETURN_CHANGE" }
  | { type: "COLLECT_ITEM" }
  | { type: "COLLECT_CHANGE" }
  | { type: "SET_MESSAGE"; message: string; messageType: MessageType };

const initialSlots: DrinkSlot[] = [
  { id: 1, code: "1", name: "콜라", price: 1100, stock: 5 },
  { id: 2, code: "2", name: "물", price: 600, stock: 5 },
  { id: 3, code: "3", name: "커피", price: 700, stock: 5 },
  { id: 4, code: "4", name: "물", price: 600, stock: 5 },
  { id: 5, code: "5", name: "물", price: 600, stock: 5 },
  { id: 6, code: "6", name: "커피", price: 700, stock: 5 },
  { id: 7, code: "7", name: "물", price: 600, stock: 5 },
  { id: 8, code: "8", name: "물", price: 600, stock: 5 },
  { id: 9, code: "9", name: "물", price: 600, stock: 5 },
  { id: 10, code: "10", name: "물", price: 600, stock: 5 },
  { id: 11, code: "11", name: "물", price: 600, stock: 5 },
  { id: 12, code: "12", name: "커피", price: 700, stock: 5 },
  { id: 13, code: "13", name: "물", price: 600, stock: 5 },
  { id: 14, code: "14", name: "물", price: 600, stock: 5 },
  { id: 15, code: "15", name: "물", price: 600, stock: 5 },
  { id: 16, code: "16", name: "물", price: 600, stock: 5 },
];

const initialState: State = {
  balance: 0,
  paymentMethod: null,
  slots: initialSlots,
  message: "Hello. This is the XID Vending Machine.",
  messageType: "idle",
  messageId: 0,
  dispensed: [],
  change: 0,
  userWallet: 10000,
  cardBalance: 10000, // 기본 카드 잔액
};

function getObjectLabel(name: string) {
  // 목적격 조사 처리: 물 → 물을, 나머지 "콜라"/"커피" 등은 그대로 + 를
  if (name === "물") return "물을";
  return `${name}를`;
}

function getSubjectLabel(name: string) {
  // 주격 조사 처리: 물 → 물이, 나머지는 ~가
  if (name === "물") return "물이";
  return `${name}가`;
}

// 메시지 + 카운터 업데이트 헬퍼
function withMessage(
  state: State,
  patch: Partial<State>,
  message: string,
  messageType: MessageType
): State {
  return {
    ...state,
    ...patch,
    message,
    messageType,
    messageId: state.messageId + 1,
  };
}

function vendingReducer(state: State, action: Action): State {
  switch (action.type) {
    case "INSERT_CASH": {
      if (state.userWallet < action.amount) {
        return withMessage(state, {}, "지갑에 돈이 부족합니다.", "error");
      }

      // 반환 슬롯에 돈이 남아 있으면 먼저 가져가도록 안내
      if (action.kind === "bill" && state.change > 0) {
        return withMessage(
          state,
          {},
          "반환된 지폐를 먼저 가져간 후 다시 넣어 주세요.",
          "error"
        );
      }

      // 카드 꽂혀 있으면 바로 거스름돈 슬롯으로
      if (state.paymentMethod === "card") {
        return withMessage(
          state,
          {
            userWallet: state.userWallet - action.amount,
            change: state.change + action.amount,
          },
          `${action.amount.toLocaleString()}원은 카드가 꽂혀 있어 바로 반환되었습니다.`,
          "error"
        );
      }

      // 지폐 인식 실패 확률
      if (action.kind === "bill") {
        const rejected = Math.random() < 0.15;
        if (rejected) {
          return withMessage(
            state,
            {
              userWallet: state.userWallet - action.amount,
              change: state.change + action.amount,
            },
            "지폐가 인식되지 않았습니다. 반환된 지폐를 먼저 가져가 주세요.",
            "error"
          );
        }
      }

      const nextBalance = state.balance + action.amount;

      return withMessage(
        state,
        {
          paymentMethod: "cash",
          balance: nextBalance,
          userWallet: state.userWallet - action.amount,
        },
        `${action.amount.toLocaleString()}원을 투입했습니다. (투입 금액 ${nextBalance.toLocaleString()}원)`,
        "info"
      );
    }

    case "INSERT_CARD": {
      const hadCash = state.balance > 0;
      const refundedAmount = hadCash ? state.balance : 0;

      const refundedText = hadCash
        ? `${refundedAmount.toLocaleString()}원을 반환하고 `
        : "";

      // 오류 카드
      if (action.kind === "error") {
        return withMessage(
          state,
          {
            paymentMethod: null,
            balance: 0,
            change: state.change + refundedAmount,
          },
          refundedText +
            "카드를 인식할 수 없습니다. 다른 카드를 사용해 주세요.",
          "error"
        );
      }

      // 정상 카드
      return withMessage(
        state,
        {
          paymentMethod: "card",
          balance: 0,
          change: state.change + refundedAmount,
        },
        refundedText + "카드가 인식되었습니다. 상품 번호를 입력해 주세요.",
        "info"
      );
    }

    case "EJECT_CARD": {
      if (state.paymentMethod !== "card") {
        return withMessage(state, {}, "꺼낼 카드가 없습니다.", "error");
      }

      return withMessage(
        state,
        { paymentMethod: null },
        "카드를 빼냈습니다.",
        "info"
      );
    }

    case "SELECT_SLOT": {
      const slot = state.slots.find((s) => s.id === action.id);
      if (!slot) {
        return withMessage(
          state,
          {},
          "선택한 음료를 찾을 수 없습니다.",
          "error"
        );
      }

      if (slot.stock <= 0) {
        return withMessage(state, {}, `${slot.name}는 품절입니다.`, "error");
      }

      if (!state.paymentMethod) {
        return withMessage(
          state,
          {},
          "먼저 현금을 넣거나 카드를 꽂아 주세요.",
          "error"
        );
      }

      // 카드 결제인 경우: 카드 잔액 체크
      if (state.paymentMethod === "card") {
        if (state.cardBalance < slot.price) {
          return withMessage(
            state,
            {},
            "카드 잔액이 부족합니다. 카드를 꺼내 주세요.",
            "error"
          );
        }
      }

      // 현금 결제인 경우: 잔액 체크
      if (state.paymentMethod === "cash" && state.balance < slot.price) {
        return withMessage(
          state,
          {},
          `금액이 부족합니다. (${slot.price.toLocaleString()}원 필요)`,
          "error"
        );
      }

      // 공통: 재고 감소
      const updatedSlots = state.slots.map((s) =>
        s.id === slot.id ? { ...s, stock: s.stock - 1 } : s
      );

      // 배출 목록 업데이트
      const existing = state.dispensed.find((d) => d.id === slot.id);
      let updatedDispensed: DispensedItem[];
      let newCount: number;

      if (existing) {
        updatedDispensed = state.dispensed.map((d) =>
          d.id === slot.id ? { ...d, count: d.count + 1 } : d
        );
        newCount = existing.count + 1;
      } else {
        updatedDispensed = [
          ...state.dispensed,
          { id: slot.id, name: slot.name, count: 1 },
        ];
        newCount = 1;
      }

      // 카드 결제
      if (state.paymentMethod === "card") {
        const nextCardBalance = state.cardBalance - slot.price;
        const objectLabel = getObjectLabel(slot.name);
        return withMessage(
          state,
          {
            slots: updatedSlots,
            cardBalance: nextCardBalance,
            dispensed: updatedDispensed,
          },
          `${objectLabel} 결제했습니다. (이번 번호에서 총 ${newCount}개 나옴)`,
          "info"
        );
      }

      // 현금 결제
      const nextBalance = state.balance - slot.price;
      const subjectLabel = getSubjectLabel(slot.name);

      return withMessage(
        state,
        {
          slots: updatedSlots,
          balance: nextBalance,
          dispensed: updatedDispensed,
        },
        `${subjectLabel} 나왔습니다. (이번 번호에서 총 ${newCount}개 나옴)`,
        "info"
      );
    }

    case "RETURN_CHANGE": {
      if (state.paymentMethod !== "cash" || state.balance === 0) {
        return withMessage(state, {}, "반환할 금액이 없습니다.", "error");
      }

      const change = state.balance;
      return withMessage(
        state,
        {
          balance: 0,
          paymentMethod: null,
          change: state.change + change,
        },
        `${change.toLocaleString()}원을 반환했습니다.`,
        "info"
      );
    }

    case "COLLECT_ITEM": {
      if (state.dispensed.length === 0) {
        return withMessage(state, {}, "가져갈 음료가 없습니다.", "error");
      }

      // 카드 결제 상태라면 추가 안내
      const extra =
        state.paymentMethod === "card"
          ? " 더 주문하지 않으시면 카드를 꺼내 주세요."
          : "";

      return withMessage(
        state,
        { dispensed: [] },
        "음료를 가져갔습니다." + extra,
        "info"
      );
    }

    case "COLLECT_CHANGE": {
      if (state.change === 0) {
        return withMessage(state, {}, "가져갈 거스름돈이 없습니다.", "error");
      }

      const nextWallet = state.userWallet + state.change;

      return withMessage(
        state,
        {
          userWallet: nextWallet,
          change: 0,
        },
        "거스름돈을 지갑에 넣었습니다.",
        "info"
      );
    }

    case "SET_MESSAGE": {
      return withMessage(state, {}, action.message, action.messageType);
    }

    default:
      return state;
  }
}

export function useVendingMachine() {
  const [state, dispatch] = useReducer(vendingReducer, initialState);

  const insertCash = (amount: number, kind: CashKind = "coin") =>
    dispatch({ type: "INSERT_CASH", amount, kind });

  const insertCard = (kind: CardKind) =>
    dispatch({ type: "INSERT_CARD", kind });

  const ejectCard = () => dispatch({ type: "EJECT_CARD" });

  const selectSlot = (id: SlotId) => dispatch({ type: "SELECT_SLOT", id });

  const returnChange = () => dispatch({ type: "RETURN_CHANGE" });

  const collectItem = () => dispatch({ type: "COLLECT_ITEM" });

  const collectChange = () => dispatch({ type: "COLLECT_CHANGE" });

  const setMessage = (message: string, messageType: MessageType) =>
    dispatch({ type: "SET_MESSAGE", message, messageType });

  const hasCard = state.paymentMethod === "card";

  return {
    state,
    insertCash,
    insertCard,
    ejectCard,
    selectSlot,
    returnChange,
    collectItem,
    collectChange,
    hasCard,
    setMessage,
  };
}
