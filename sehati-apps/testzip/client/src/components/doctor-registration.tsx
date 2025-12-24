import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

interface DoctorRegistrationProps {
  walletAddress: string;
  onSuccess: () => void;
}

export function DoctorRegistration({ walletAddress, onSuccess }: DoctorRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    practice: "",
    age: "",
    gender: "male" as "male" | "female" | "other",
  });
  const { toast } = useToast();
  const { connectWithWallet } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.practice.trim() || !formData.age) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await connectWithWallet({
        walletAddress,
        name: formData.name,
        role: "doctor",
        gender: formData.gender,
        age: parseInt(formData.age),
        hospital: formData.practice,
      });
      toast({
        title: "Success",
        description: "Registration completed!",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Doctor Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          <Input
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Practice Location</label>
          <Input
            type="text"
            placeholder="e.g., Jakarta Medical Center"
            value={formData.practice}
            onChange={(e) => setFormData({ ...formData, practice: e.target.value })}
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Age</label>
          <Input
            type="number"
            placeholder="Enter your age"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            disabled={loading}
            min="1"
            max="150"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as "male" | "female" | "other" })}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Registering..." : "Complete Registration"}
        </Button>
      </form>
    </div>
  );
}
