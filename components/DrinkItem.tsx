import type { DrinkSlot } from "../hooks/useVendingMachine";

type Props = {
  slot: DrinkSlot;
};

export function DrinkItem({ slot }: Props) {
  const isOutOfStock = slot.stock <= 0;
  const variantClass = isOutOfStock ? "drink-card--soldout" : "";

  const maxDots = 5;
  const visibleStock = Math.min(slot.stock, maxDots);
  const dots = Array.from({ length: maxDots }, (_, idx) => idx < visibleStock);

  return (
    <div className={`drink-card ${variantClass}`}>
      <div className="drink-card__header">
        <div className="drink-card__name">
          {slot.name}
          {isOutOfStock && (
            <span className="drink-card__soldout-tag"> 품절</span>
          )}
        </div>
        <span className="drink-card__slot">#{slot.code}</span>
      </div>
      <div className="drink-card__meta">
        <span>{slot.price.toLocaleString()}원</span>
        <div className="drink-card__stock">
          <span className="drink-card__stock-label">재고</span>
          <div className="drink-card__dots">
            {dots.map((filled, idx) => (
              <span
                key={idx}
                className={
                  "drink-card__dot" + (filled ? " drink-card__dot--filled" : "")
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
