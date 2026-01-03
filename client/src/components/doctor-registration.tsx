import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { generateNonce } from "@/lib/api";
import { generateKeyPair } from "@/lib/encryption";
// @ts-ignore
import { useAccount } from "wagmi";
import { useEthersSigner } from "@/lib/blockchain";
import { LogOut, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // [NEW] Import motion
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Zod Schema Validation
const doctorSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  practice: z.string().min(3, "Practice location must be at least 3 characters"),
  age: z.coerce.number().min(21, "Must be at least 21").max(120, "Invalid age"),
  gender: z.enum(["male", "female", "other"], { required_error: "Please select a gender" })
});

type DoctorFormData = z.infer<typeof doctorSchema>;

interface DoctorRegistrationProps {
  walletAddress: string;
  onSuccess: () => void;
  onDisconnect?: () => void;
  isWalletConnect?: boolean;
}

export function DoctorRegistration({ walletAddress, onSuccess, onDisconnect }: DoctorRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null); // [NEW] Track focus
  const { toast } = useToast();
  const { connectWithWalletSignature } = useAuth();
  const { address } = useAccount();
  const signer = useEthersSigner();

  // Initialize Form
  const form = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      practice: "",
      age: "" as any, // Initialize as empty string so placeholder shows
      gender: "male",
    },
  });

  const onSubmit = async (data: DoctorFormData) => {
    setLoading(true);

    // Show initial loading toast
    const loadingToast = toast({
      title: "Processing...",
      description: "Please wait",
      duration: 60000,
    });

    try {
      const registrationData = {
        walletAddress,
        name: data.name,
        role: "doctor" as const,
        gender: data.gender,
        age: data.age,
        hospital: data.practice,
      };

      // Enforce signature flow for ALL wallets
      if (address) {
        console.log("🔵 Starting secure registration with signature", {
          address,
          walletAddress,
          windowEthereum: typeof window !== 'undefined' && !!(window as any).ethereum
        });

        try {
          // [Check] Signer safety handled at method level now, but good to keep check
          if (!signer) {
            throw new Error("Wallet signer not available. Please ensure your wallet is connected.");
          }

          // Step 1: Generate Key Pair (Client-Side)
          toast({
            title: "Security Setup",
            description: "Generating your secure encryption keys...",
            duration: 5000,
          });
          const { publicKeyStr, privateKeyStr } = await generateKeyPair();
          localStorage.setItem(`sehati_priv_${walletAddress}`, privateKeyStr);

          // Step 2: Generate nonce
          toast({
            title: "Step 1/3",
            description: "Generating verification message...",
            duration: 5000,
          });
          const { message } = await generateNonce(walletAddress);

          // Step 3: Sign message
          toast({
            title: "Step 2/3",
            description: "Please sign the message in your wallet...",
            duration: 30000,
          });

          // Add timeout for signature request
          const signaturePromise = signer.signMessage(message);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Signature request timed out.")), 60000)
          );

          const signature = await Promise.race([signaturePromise, timeoutPromise]) as string;

          // Step 4: Register
          toast({
            title: "Step 3/3",
            description: "Completing registration...",
            duration: 10000,
          });

          const dataWithKey = {
            ...registrationData,
            publicKey: publicKeyStr
          };

          await connectWithWalletSignature(dataWithKey, signature, message);
          console.log("✅ Registration completed successfully!");

        } catch (error: any) {
          console.error("❌ Registration error:", error);

          let errorMessage = "Registration failed. Please try again.";

          // Safe check for message existence
          const errStr = error?.message || "Unknown error";

          if (errStr.includes("user rejected") || errStr.includes("User denied")) {
            errorMessage = "Signature request was rejected. Please approve the signature request in your wallet to continue.";
          } else if (errStr.includes("timeout")) {
            errorMessage = "Signature request timed out. Please try again and approve the request promptly.";
          } else if (errStr.includes("provider")) {
            errorMessage = "Wallet provider not available. Please ensure your wallet is connected.";
          } else if (error.message) {
            errorMessage = error.message;
          }

          throw new Error(errorMessage);
        }
      } else {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }

      // Dismiss loading toast
      if (loadingToast.dismiss) loadingToast.dismiss();

      toast({
        title: "✅ Success!",
        description: "Registration completed successfully!",
        duration: 5000,
      });

      onSuccess();
    } catch (error: any) {
      console.error("❌ Registration error:", error);

      // Dismiss loading toast
      if (loadingToast.dismiss) loadingToast.dismiss();

      toast({
        title: "❌ Registration Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (onDisconnect) {
      onDisconnect();
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Helper for smoother field rendering
  const MorphingField = ({ name, children }: { name: string, children: React.ReactNode }) => (
    <div
      className="relative group"
      onFocus={() => setFocusedField(name)}
      onBlur={() => setFocusedField(null)}
    >
      <AnimatePresence>
        {focusedField === name && (
          <motion.div
            layoutId="focused-field-bg"
            className="absolute -inset-3 bg-blue-50/50 rounded-xl border border-blue-200/60 z-0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10">{children}</div>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Connected Wallet Info */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/40 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
        <div className="relative flex items-center justify-between z-10">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Connected Wallet</p>
            <p className="text-base font-mono font-bold text-gray-900 tracking-tight">{truncateAddress(walletAddress)}</p>
          </div>
          {onDisconnect && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Doctor Registration</h2>
        <p className="text-sm text-gray-500">Complete your profile to start accessing the registry.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          <MorphingField name="name">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} disabled={loading} className="bg-white/80 backdrop-blur-sm" />
                  </FormControl>
                  <AnimatePresence>
                    {form.formState.errors.name && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <FormMessage className="text-xs pt-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </FormItem>
              )}
            />
          </MorphingField>

          <MorphingField name="practice">
            <FormField
              control={form.control}
              name="practice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Practice Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jakarta Medical Center" {...field} disabled={loading} className="bg-white/80 backdrop-blur-sm" />
                  </FormControl>
                  <AnimatePresence>
                    {form.formState.errors.practice && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <FormMessage className="text-xs pt-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </FormItem>
              )}
            />
          </MorphingField>

          <div className="grid grid-cols-2 gap-4">
            <MorphingField name="age">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Age"
                        {...field}
                        disabled={loading}
                        className="bg-white/80 backdrop-blur-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </MorphingField>

            <MorphingField name="gender">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                      <FormControl>
                        <SelectTrigger className="bg-white/80 backdrop-blur-sm">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </MorphingField>
          </div>

          <Button type="submit" disabled={loading} className="w-full relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-cyan-500 transition-transform duration-300 group-hover:scale-105" />
            <div className="relative flex items-center justify-center">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Complete Registration"
              )}
            </div>
          </Button>
        </form>
      </Form>
    </div>
  );
}
