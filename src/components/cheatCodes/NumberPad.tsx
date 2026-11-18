const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

export default function NumberPad({ value, setValue, label, maxDigits = 4 }: {
  value: string
  setValue: (value: string) => void
  label: string
  maxDigits?: number
}) {
  return <div className="number-pad" role="group" aria-label={label} tabIndex={0} onKeyDown={(event) => {
    if (/^[0-9]$/.test(event.key) && value.length < maxDigits) {
      event.preventDefault()
      setValue(value === '0' ? event.key : value + event.key)
    } else if (event.key === 'Backspace') {
      event.preventDefault()
      setValue(value.slice(0, -1))
    }
  }}>
    <div className="number-display"><span>{label}</span><output aria-label={label}>{value || '—'}</output></div>
    <div className="number-keys">
      {digits.map((digit) => <button type="button" key={digit} className="button outline-button" aria-label={digit}
        disabled={value.length >= maxDigits || (value === '0' && digit === '0')}
        onClick={() => setValue(value === '0' ? digit : value + digit)}>{digit}</button>)}
      <button type="button" className="button outline-button erase-key" aria-label="Erase last digit" disabled={!value}
        onClick={() => setValue(value.slice(0, -1))}>Erase</button>
    </div>
  </div>
}
