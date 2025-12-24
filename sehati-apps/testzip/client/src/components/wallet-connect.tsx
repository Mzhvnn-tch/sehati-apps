import { Wallet, Loader2, LogOut, Plus, Link2, Copy, AlertTriangle, Check, Eye, EyeOff, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface WalletConnectProps {
  className?: string;
  initialRole?: "patient" | "doctor";
  autoOpen?: boolean;
}

export function WalletConnect({ className, initialRole, autoOpen }: WalletConnectProps) {
  const { user, isLoading, walletInfo, generateNewWallet, connectWithWallet, loginWithExistingWallet, disconnect, clearWalletInfo, setExternalWallet } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showDialog, setShowDialog] = useState(autoOpen ?? false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">(initialRole ?? "patient");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [age, setAge] = useState("");
  const [hospital, setHospital] = useState("");
  const [existingWalletAddress, setExistingWalletAddress] = useState("");
  const [existingPrivateKey, setExistingPrivateKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showExistingPrivateKey, setShowExistingPrivateKey] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [step, setStep] = useState<"choose" | "generate" | "connect" | "register">("choose");
  const [error, setError] = useState<string | null>(null);

  const handleGenerateWallet = async () => {
    try {
      setError(null);
      await generateNewWallet();
      setStep("register");
    } catch (err: any) {
      setError(err.message || "Failed to generate wallet");
    }
  };

  const handleConnectExisting = async () => {
    if (!existingWalletAddress.trim()) {
      setError("Please enter your wallet address");
      return;
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(existingWalletAddress)) {
      setError("Invalid wallet address format");
      return;
    }

    if (!existingPrivateKey.trim()) {
      setError("Please enter your private key to verify ownership");
      return;
    }

    try {
      setError(null);
      const result = await loginWithExistingWallet(existingWalletAddress, existingPrivateKey);
      
      if (result.success) {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in with your wallet",
        });
        handleClose();
        // Redirect to dashboard based on role
        if (result.userRole === "doctor") {
          setLocation("/doctor");
        } else {
          setLocation("/patient");
        }
      } else if (result.verified && !result.exists) {
        setExternalWallet(existingWalletAddress, existingPrivateKey);
        toast({
          title: "Wallet Verified!",
          description: "Your wallet is verified. Please complete registration to continue.",
        });
        setStep("register");
      } else {
        setError("Invalid signature. Please check your wallet address and private key.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      setError("Please enter a valid age");
      return;
    }

    if (role === "doctor" && !hospital.trim()) {
      setError("Please enter your hospital/clinic name");
      return;
    }
    
    const address = walletInfo?.address || existingWalletAddress;
    if (!address) {
      setError("No wallet address available");
      return;
    }

    try {
      setError(null);
      await connectWithWallet({
        walletAddress: address,
        name: name.trim(),
        role,
        gender,
        age: ageNum,
        hospital: role === "doctor" ? hospital.trim() : null,
      });
      toast({
        title: "Registration Successful",
        description: `Welcome to SEHATI, ${name}!`,
      });
      handleClose();
      // Redirect to dashboard based on role
      if (role === "doctor") {
        setLocation("/doctor");
      } else {
        setLocation("/patient");
      }
    } catch (err: any) {
      setError(err.message || "Failed to register");
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    setStep("choose");
    setName("");
    setRole(initialRole ?? "patient");
    setGender("male");
    setAge("");
    setHospital("");
    setExistingWalletAddress("");
    setExistingPrivateKey("");
    setError(null);
    setShowPrivateKey(false);
    setShowExistingPrivateKey(false);
    setShowMnemonic(false);
    clearWalletInfo();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className={cn("font-mono text-xs gap-2 bg-primary/5 border border-primary/20 text-primary px-3 py-2 rounded-md flex items-center", className)}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(38)}
        </div>
        <Button variant="outline" size="sm" onClick={() => disconnect()} className="h-9">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button 
        onClick={() => setShowDialog(true)}
        disabled={isLoading}
        className={cn("gap-2 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20", className)}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
        {isLoading ? "Connecting..." : "Get Started"}
      </Button>

      <Dialog open={showDialog} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "choose" && "Welcome to SEHATI"}
              {step === "generate" && "Generate New Wallet"}
              {step === "connect" && "Connect Existing Wallet"}
              {step === "register" && "Complete Registration"}
            </DialogTitle>
            <DialogDescription>
              {step === "choose" && "Secure, decentralized health identity management"}
              {step === "generate" && "Create a new wallet for your health identity"}
              {step === "connect" && "Enter your wallet credentials to login"}
              {step === "register" && "Save your wallet details and complete setup"}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === "choose" && (
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">New User</TabsTrigger>
                <TabsTrigger value="existing">Existing User</TabsTrigger>
              </TabsList>
              
              <TabsContent value="new" className="space-y-4 mt-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Generate New Wallet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a new blockchain wallet to store your health identity securely.
                  </p>
                  <Button onClick={handleGenerateWallet} disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Generate Wallet
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="existing" className="space-y-4 mt-4">
                <div className="py-4">
                  <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Link2 className="w-8 h-8 text-cyan-500" />
                  </div>
                  <h3 className="font-semibold mb-2 text-center">Connect Existing Wallet</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Sign in with your existing wallet credentials.
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Wallet Address</Label>
                      <Input
                        value={existingWalletAddress}
                        onChange={(e) => setExistingWalletAddress(e.target.value)}
                        placeholder="0x..."
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Private Key (for verification)</Label>
                      <div className="relative">
                        <Input
                          type={showExistingPrivateKey ? "text" : "password"}
                          value={existingPrivateKey}
                          onChange={(e) => setExistingPrivateKey(e.target.value)}
                          placeholder="Your private key"
                          className="font-mono text-sm pr-10"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowExistingPrivateKey(!showExistingPrivateKey)}
                        >
                          {showExistingPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your private key is used to verify wallet ownership and is never stored.
                      </p>
                    </div>
                    <Button onClick={handleConnectExisting} disabled={isLoading} variant="outline" className="w-full">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                      Sign In
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {step === "register" && walletInfo && (
            <div className="space-y-4">
              {walletInfo.mnemonic ? (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-sm">
                    Save your private key and recovery phrase securely. They cannot be recovered if lost!
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-sm">
                    Your wallet has been verified! Complete registration to start using SEHATI.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                  <div className="flex gap-2">
                    <Input value={walletInfo.address} readOnly className="font-mono text-xs" />
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={() => copyToClipboard(walletInfo.address, "Address")}
                    >
                      {copiedField === "Address" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {walletInfo.privateKey && walletInfo.mnemonic && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Private Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input 
                            value={showPrivateKey ? walletInfo.privateKey : "••••••••••••••••••••"} 
                            readOnly 
                            className="font-mono text-xs pr-10" 
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                          >
                            {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => copyToClipboard(walletInfo.privateKey, "Private Key")}
                        >
                          {copiedField === "Private Key" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Recovery Phrase (Mnemonic)</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input 
                            value={showMnemonic ? walletInfo.mnemonic : "•••• •••• •••• •••• •••• ••••"} 
                            readOnly 
                            className="font-mono text-xs pr-10" 
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowMnemonic(!showMnemonic)}
                          >
                            {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => copyToClipboard(walletInfo.mnemonic, "Mnemonic")}
                        >
                          {copiedField === "Mnemonic" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="space-y-2">
                  <Label>Your Name <span className="text-red-500">*</span></Label>
                  <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Gender <span className="text-red-500">*</span></Label>
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value as "male" | "female" | "other")}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Age <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Your age"
                      min="0"
                      max="150"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role <span className="text-red-500">*</span></Label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value as "patient" | "doctor")}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
                {role === "doctor" && (
                  <div className="space-y-2">
                    <Label>Hospital / Clinic <span className="text-red-500">*</span></Label>
                    <Input 
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="Where do you practice?"
                    />
                  </div>
                )}
                <Button onClick={handleRegister} className="w-full" disabled={!name.trim() || !age || isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Complete Registration
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
