// Package calculator contains the pure arithmetic logic. It has no knowledge
// of HTTP, which keeps it trivial to test and reuse.
package calculator

import (
	"errors"
	"fmt"
	"math"
)

// Operation identifies a supported calculator operation.
type Operation string

const (
	Add        Operation = "add"
	Subtract   Operation = "subtract"
	Multiply   Operation = "multiply"
	Divide     Operation = "divide"
	Power      Operation = "power"
	Sqrt       Operation = "sqrt"
	Percentage Operation = "percentage"
)

// Sentinel errors let callers distinguish failure causes with errors.Is.
var (
	ErrDivisionByZero    = errors.New("division by zero")
	ErrNegativeSqrt      = errors.New("square root of a negative number")
	ErrUnknownOperation  = errors.New("unknown operation")
	ErrMissingOperand    = errors.New("missing operand")
	ErrResultNotFinite   = errors.New("result is not a finite number")
	ErrInvalidOperandNaN = errors.New("operands must be finite numbers")
)

// IsUnary reports whether the operation only needs the first operand.
func (o Operation) IsUnary() bool { return o == Sqrt }

// Calculate runs op on the given operands. For unary operations b is ignored
// and may be nil. Percentage means "a percent of b" (e.g. 15, 200 -> 30).
func Calculate(op Operation, a float64, b *float64) (float64, error) {
	if !isFinite(a) {
		return 0, ErrInvalidOperandNaN
	}
	if !op.IsUnary() {
		if b == nil {
			return 0, fmt.Errorf("%w: %q needs two operands", ErrMissingOperand, op)
		}
		if !isFinite(*b) {
			return 0, ErrInvalidOperandNaN
		}
	}

	var result float64
	switch op {
	case Add:
		result = a + *b
	case Subtract:
		result = a - *b
	case Multiply:
		result = a * *b
	case Divide:
		if *b == 0 {
			return 0, ErrDivisionByZero
		}
		result = a / *b
	case Power:
		result = math.Pow(a, *b)
	case Sqrt:
		if a < 0 {
			return 0, ErrNegativeSqrt
		}
		result = math.Sqrt(a)
	case Percentage:
		result = a / 100 * *b
	default:
		return 0, fmt.Errorf("%w: %q", ErrUnknownOperation, op)
	}

	// Catches overflow (1e308 * 10) and undefined results (0^-1, (-8)^0.5).
	if !isFinite(result) {
		return 0, ErrResultNotFinite
	}
	return result, nil
}

func isFinite(f float64) bool { return !math.IsNaN(f) && !math.IsInf(f, 0) }
