package calculator

import (
	"errors"
	"math"
	"testing"
)

func ptr(f float64) *float64 { return &f }

func TestCalculate(t *testing.T) {
	tests := []struct {
		name string
		op   Operation
		a    float64
		b    *float64
		want float64
	}{
		{"add", Add, 2, ptr(3), 5},
		{"add negatives", Add, -2, ptr(-3), -5},
		{"subtract", Subtract, 10, ptr(4), 6},
		{"multiply", Multiply, 6, ptr(7), 42},
		{"multiply by zero", Multiply, 6, ptr(0), 0},
		{"divide", Divide, 9, ptr(3), 3},
		{"divide fractional", Divide, 1, ptr(4), 0.25},
		{"power", Power, 2, ptr(10), 1024},
		{"power negative exponent", Power, 2, ptr(-1), 0.5},
		{"power zero exponent", Power, 5, ptr(0), 1},
		{"sqrt", Sqrt, 144, nil, 12},
		{"sqrt zero", Sqrt, 0, nil, 0},
		{"sqrt ignores b", Sqrt, 9, ptr(100), 3},
		{"percentage", Percentage, 15, ptr(200), 30},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.op, tt.a, tt.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if math.Abs(got-tt.want) > 1e-9 {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCalculateErrors(t *testing.T) {
	tests := []struct {
		name string
		op   Operation
		a    float64
		b    *float64
		want error
	}{
		{"divide by zero", Divide, 1, ptr(0), ErrDivisionByZero},
		{"negative sqrt", Sqrt, -4, nil, ErrNegativeSqrt},
		{"unknown op", Operation("mod"), 1, ptr(2), ErrUnknownOperation},
		{"missing b", Add, 1, nil, ErrMissingOperand},
		{"NaN operand", Add, math.NaN(), ptr(1), ErrInvalidOperandNaN},
		{"Inf operand b", Add, 1, ptr(math.Inf(1)), ErrInvalidOperandNaN},
		{"overflow", Multiply, 1e308, ptr(10), ErrResultNotFinite},
		{"zero to negative power", Power, 0, ptr(-1), ErrResultNotFinite},
		{"negative base fractional power", Power, -8, ptr(0.5), ErrResultNotFinite},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Calculate(tt.op, tt.a, tt.b)
			if !errors.Is(err, tt.want) {
				t.Errorf("got error %v, want %v", err, tt.want)
			}
		})
	}
}
