import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, countryCode, onCountryCodeChange, ...props }, ref) => {
    const countryCodes = [
      { code: "+212", name: "Morocco 🇲🇦" },
      { code: "+33", name: "France 🇫🇷" },
      { code: "+1", name: "USA/Canada 🇺🇸" },
      { code: "+44", name: "UK 🇬🇧" },
      { code: "+49", name: "Germany 🇩🇪" },
      { code: "+81", name: "Japan 🇯🇵" },
      { code: "+86", name: "China 🇨🇳" },
      { code: "+91", name: "India 🇮🇳" },
      { code: "+7", name: "Russia 🇷🇺" },
      { code: "+55", name: "Brazil 🇧🇷" },
      { code: "+34", name: "Spain 🇪🇸" },
      { code: "+39", name: "Italy 🇮🇹" },
      { code: "+61", name: "Australia 🇦🇺" },
      { code: "+82", name: "South Korea 🇰🇷" },
      { code: "+90", name: "Turkey 🇹🇷" },
      { code: "+213", name: "Algeria 🇩🇿" },
      { code: "+216", name: "Tunisia 🇹🇳" },
      { code: "+20", name: "Egypt 🇪🇬" },
    ];

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow only numbers
      const numericValue = e.target.value.replace(/[^\d]/g, "");
      // Limit to 10 digits
      const limitedValue = numericValue.slice(0, 10);
      onChange(limitedValue);
    };

    return (
      <div className="flex gap-2">
        <Select value={countryCode} onValueChange={onCountryCodeChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Code" />
          </SelectTrigger>
          <SelectContent>
            {countryCodes.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          ref={ref}
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder="Phone number"
          inputMode="numeric"
          pattern="[0-9]*"
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";