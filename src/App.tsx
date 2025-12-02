// src/App.tsx
import { useEffect, useState } from "react";
import "./App.css";
import { DrinkItem } from "../components/DrinkItem";
import { useVendingMachine } from "../hooks/useVendingMachine";

function App() {
  const {
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
  } = useVendingMachine();

  // 번호 입력 버퍼 (예: "1" -> "16")
  const [inputBuffer, setInputBuffer] = useState("");

  const selectedSlot = inputBuffer.length > 0 ? Number(inputBuffer) : null;

  const paymentLabel =
    state.paymentMethod === "cash"
      ? "현금"
      : state.paymentMethod === "card"
      ? "카드"
      : "없음";

  const minPrice =
    state.slots.length > 0 ? Math.min(...state.slots.map((s) => s.price)) : 0;

  // 실제로 결제가 가능한 상태인지 (카드 or 잔액이 최저가 이상)
  const canInputSlot =
    state.paymentMethod === "card" ||
    (state.paymentMethod === "cash" && state.balance >= minPrice);

  // 키패드 숫자: 1 ~ 9 (0은 마지막 줄 중앙에 따로 배치)
  const keypadNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // 번호 버튼 눌렀을 때
  const handleKeypadPress = (num: number) => {
    // 결제 수단이 없거나, 현금인데 잔액 0이면 바로 안내
    if (
      !state.paymentMethod ||
      (state.paymentMethod === "cash" && state.balance === 0)
    ) {
      setMessage("먼저 현금을 넣거나 카드를 꽂아 주세요.", "error");
      setInputBuffer("");
      return;
    }

    // 두 자리까지 입력: 1 -> "1", 2 -> "12", 6 -> "16" 이런 식
    const next = (inputBuffer + String(num)).slice(-2);
    setInputBuffer(next);
  };

  const handleConfirm = () => {
    if (selectedSlot == null) return;

    // 결제 상태 없으면 안내 후 초기화
    if (
      !state.paymentMethod ||
      (state.paymentMethod === "cash" && state.balance === 0)
    ) {
      setMessage("먼저 현금을 넣거나 카드를 꽂아 주세요.", "error");
      setInputBuffer("");
      return;
    }

    const slot = state.slots.find((s) => s.id === selectedSlot);
    if (!slot) {
      setMessage("해당 번호의 음료가 없습니다.", "error");
      setInputBuffer("");
      return;
    }

    selectSlot(slot.id);
    // 성공 시에는 번호 유지 → 같은 번호로 계속 뽑을 수 있음
  };

  const handleInsertNormalCard = () => {
    setMessage("카드를 읽고 있습니다...", "info");
    setTimeout(() => {
      insertCard("normal");
    }, 800);
  };

  const handleInsertErrorCard = () => {
    setMessage("카드를 읽고 있습니다...", "info");
    setTimeout(() => {
      insertCard("error");
    }, 800);
  };

  // 메시지 5초 후 자동 초기화
  useEffect(() => {
    // 이미 기본 인사말이면 타이머 안 건다
    if (
      state.messageType === "idle" &&
      state.message === "Hello. This is the XID Vending Machine."
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage("Hello. This is the XID Vending Machine.", "idle");
    }, 10000);

    // 새 메시지가 들어오면 이전 타이머 취소
    return () => clearTimeout(timer);
  }, [state.messageId, state.messageType, state.message, setMessage]);

  return (
    <div className="app-root">
      <div className="app-inner">
        <div className="vending-layout">
          {/* 왼쪽: 자판기 본체 */}
          <div className="machine">
            {/* 전광판 */}
            <div className="machine__display">
              <div className="machine__display-row" style={{ gap: "unset" }}>
                <h1 className="app-title">XID Vending Machine</h1>
                <span />
              </div>

              {/* 결제 수단 + 투입 금액 + 거스름돈 반환 */}
              <div className="machine__display-row machine__display-row--with-action">
                <span>결제 수단: {paymentLabel}</span>
                <div className="machine__display-actions">
                  <span>투입 금액: {state.balance.toLocaleString()}원</span>
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    disabled={
                      state.paymentMethod !== "cash" || state.balance === 0
                    }
                    onClick={() => {
                      returnChange();
                      setInputBuffer("");
                    }}
                    style={{ minWidth: "100px" }}
                  >
                    거스름돈 반환
                  </button>
                </div>
              </div>

              {/* 카드 꺼내기 – 카드 있을 때만 활성화 */}
              <div className="machine__display-row machine__display-row--with-action machine__display-row--secondary">
                <span />
                <div className="machine__display-actions">
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    disabled={!hasCard}
                    onClick={ejectCard}
                    style={{ minWidth: "100px", marginTop: "4px" }}
                  >
                    카드 꺼내기
                  </button>
                </div>
              </div>

              <div
                key={state.messageId}
                className={
                  "machine__display-message " +
                  `machine__display-message--${state.messageType}`
                }
              >
                {state.message}
              </div>
            </div>

            {/* 음료 슬롯 */}
            <div className="machine__drinks">
              {state.slots.map((slot) => (
                <DrinkItem key={slot.id} slot={slot} />
              ))}
            </div>

            {/* 번호 키패드 */}
            <div
              className={
                "machine__keypad" +
                (canInputSlot ? " machine__keypad--active" : "")
              }
            >
              <div className="machine__keypad-header">
                <div className="panel-label">상품 번호 입력</div>
                <div className="machine__keypad-selected">
                  선택 번호:{" "}
                  {selectedSlot != null ? selectedSlot : "선택되지 않음"}
                </div>
              </div>
              <div className="keypad-grid">
                {/* 1 ~ 9 */}
                {keypadNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={
                      "btn btn-keypad" +
                      (inputBuffer.endsWith(String(num))
                        ? " btn-keypad--active"
                        : "")
                    }
                    onClick={() => handleKeypadPress(num)}
                  >
                    {num}
                  </button>
                ))}

                {/* 마지막 줄: 입력 취소 / 0 / 확인 */}

                {/* 노랑 박스: 입력 취소 */}
                <button
                  type="button"
                  className="btn btn-keypad btn-keypad-clear"
                  onClick={() => setInputBuffer("")}
                >
                  다시 입력
                </button>

                {/* 초록 박스: 0 */}
                <button
                  type="button"
                  className={
                    "btn btn-keypad" +
                    (inputBuffer.endsWith("0") ? " btn-keypad--active" : "")
                  }
                  onClick={() => handleKeypadPress(0)}
                >
                  0
                </button>

                {/* 빨강 박스: 확인 */}
                <button
                  type="button"
                  className="btn btn-keypad btn-keypad-confirm"
                  disabled={selectedSlot == null}
                  onClick={handleConfirm}
                >
                  확인
                </button>
              </div>
            </div>

            {/* 배출 슬롯: 음료 / 거스름돈 분리 */}
            <div className="machine__slots">
              {/* 음료 슬롯 */}
              <div className="machine__slot">
                {state.dispensed.length > 0 ? (
                  <div className="machine__slot-inner">
                    <div>
                      {state.dispensed.map((item) => (
                        <div key={item.id}>
                          {item.name} {item.count}개 나와 있습니다.
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={collectItem}
                      style={{ backgroundColor: "#f97373" }}
                    >
                      음료 가져가기
                    </button>
                  </div>
                ) : (
                  <div>아직 나온 음료가 없습니다.</div>
                )}
              </div>

              {/* 거스름돈 슬롯 */}
              <div className="machine__slot">
                {state.change > 0 ? (
                  <div className="machine__slot-inner">
                    <div>
                      {state.change.toLocaleString()}원의 거스름돈이
                      반환되었습니다.
                    </div>
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={collectChange}
                      style={{ backgroundColor: "#f97373" }}
                    >
                      거스름돈 가져가기
                    </button>
                  </div>
                ) : (
                  <div>아직 나온 거스름돈이 없습니다.</div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 결제 패널 */}
          <div className="panel">
            {/* 카드 */}
            <div className="panel-section">
              <div className="panel-label">카드</div>
              <div
                className="panel-value"
                style={{ marginBottom: "0.5rem", fontSize: 14 }}
              >
                카드 잔액: {state.cardBalance.toLocaleString()}원
              </div>
              <div className="buttons-row">
                <button
                  type="button"
                  className="btn btn-toggle"
                  onClick={handleInsertNormalCard}
                >
                  정상 카드
                </button>
                <button
                  type="button"
                  className="btn btn-toggle"
                  onClick={handleInsertErrorCard}
                >
                  오래된 카드
                </button>
              </div>
            </div>

            {/* 현금 투입 */}
            <div className="panel-section">
              <div className="panel-label">현금 투입</div>
              <div
                className="panel-value"
                style={{ marginBottom: "0.5rem", fontSize: 14 }}
              >
                소지금: {state.userWallet.toLocaleString()}원
              </div>
              <div className="buttons-row">
                {[100, 500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="btn btn-cash"
                    onClick={() => insertCash(amount, "coin")}
                  >
                    {amount.toLocaleString()}원
                  </button>
                ))}
                {[1000, 5000, 10000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="btn btn-cash"
                    onClick={() => insertCash(amount, "bill")}
                  >
                    {amount.toLocaleString()}원
                  </button>
                ))}
              </div>
              <div className="panel-hint">
                지폐는 가끔 인식에 실패할 수 있습니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
