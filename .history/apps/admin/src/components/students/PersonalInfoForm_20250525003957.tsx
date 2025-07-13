
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Control } from "react-hook-form";
import { FormValues } from "./formSchema";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { FACULTIES } from "@/mock/academicData";

interface PersonalInfoFormProps {
  control: Control<FormValues>;
}

const PersonalInfoForm = ({ control }: PersonalInfoFormProps) => {
  return (
    <>
      <FormField
        control={control}
        name="full_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name *</FormLabel>
            <FormControl>
              <Input placeholder="e.g Said Abdishakur Ibrahim" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="registration_no"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Registration Number *</FormLabel>
            <FormControl>
              <Input placeholder="e.g GRW-BCS-2005" {...field} />
            </FormControl>
            <FormDescription>
              Format: GRW-BCS-2005, GRW-BBA-2005, etc.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="certificate_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Certificate Serial No</FormLabel>
            <FormControl>
              <Input placeholder="e.g 8261" maxLength={4} {...field} />
            </FormControl>
            <FormDescription>
              Four-digit certificate number
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="gender"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Gender *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <label htmlFor="male">Male</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <label htmlFor="female">Female</label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="phone_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input placeholder="+252907845512" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="faculty_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Faculty</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a faculty" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {FACULTIES.map((faculty) => (
                  <SelectItem 
                    key={faculty.id} 
                    value={faculty.id.toString()}
                  >
                    {faculty.name} ({faculty.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default PersonalInfoForm;
