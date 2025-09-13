"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Building2,
    CheckCircle,
    ArrowRight,
    Leaf,
    Shield,
    Zap,
    Loader2,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/hooks/use-wallet";

export default function OnboardingPage() {
    const router = useRouter();
    const { address, isConnected } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: "",
        companyAddress: "",
        companyType: "",
        companyScale: "",
        companyZipCode: "",
        companyWebsite: "",
        companyEmail: "",
        companyPhone: "",
        walletAddress: address || ""
    });

    const totalSteps = 3;

    useEffect(() => {
        if (!isConnected || !address) {
            router.push('/login');
            return;
        }

        setFormData(prev => ({
            ...prev,
            walletAddress: address
        }));
    }, [address, isConnected, router]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/companies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Company registered successfully!");
                router.push('/dashboard');
            } else {
                toast.error(result.error || "Failed to register company");
            }
        } catch (error) {
            console.error('Error registering company:', error);
            toast.error("An error occurred while registering the company");
        } finally {
            setIsLoading(false);
        }
    };

    const isStepValid = (step: number) => {
        switch (step) {
            case 1:
                return formData.companyName && formData.companyType && formData.companyScale;
            case 2:
                return formData.companyAddress && formData.companyZipCode && formData.companyWebsite;
            case 3:
                return formData.companyEmail && formData.companyPhone;
            default:
                return false;
        }
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Please connect your wallet to continue with company registration.
                        </p>
                        <Button onClick={() => router.push('/login')}>
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* Navigation */}
            <nav className="border-b bg-background/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
                            <span className="text-xl font-bold text-foreground">CarbonTrack</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Step {currentStep} of {totalSteps}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Progress Bar */}
            <div className="bg-background/50 backdrop-blur-sm border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step <= currentStep
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                    {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                                </div>
                                {step < totalSteps && (
                                    <div className={`w-16 h-1 mx-2 rounded ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
                <Card className="w-full max-w-2xl border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-900/80">
                    <CardHeader className="space-y-4 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-600">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <CardTitle className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text font-bold text-2xl text-transparent">
                                {currentStep === 1 && "Company Information"}
                                {currentStep === 2 && "Contact Details"}
                                {currentStep === 3 && "Final Details"}
                            </CardTitle>
                            <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                                {currentStep === 1 && "Let's start with your company's basic information"}
                                {currentStep === 2 && "Add your company's contact and location details"}
                                {currentStep === 3 && "Complete your registration with contact information"}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Step 1: Basic Information */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="companyName">Company Name *</Label>
                                            <Input
                                                id="companyName"
                                                value={formData.companyName}
                                                onChange={(e) => handleInputChange('companyName', e.target.value)}
                                                placeholder="Enter company name"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="companyType">Company Type *</Label>
                                            <Select
                                                value={formData.companyType}
                                                onValueChange={(value) => handleInputChange('companyType', value)}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select company type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                                                    <SelectItem value="OEM">OEM</SelectItem>
                                                    <SelectItem value="Logistics">Logistics</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="companyScale">Company Size *</Label>
                                        <Select
                                            value={formData.companyScale}
                                            onValueChange={(value) => handleInputChange('companyScale', value)}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select company size" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="small">Small (1-100 employees)</SelectItem>
                                                <SelectItem value="medium">Medium (100-1000 employees)</SelectItem>
                                                <SelectItem value="large">Large (1000+ employees)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                                        <Shield className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                                            <strong>Your wallet address:</strong> {formData.walletAddress}
                                            <br />
                                            This will be used as your unique company identifier.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            {/* Step 2: Contact Details */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyAddress">Company Address *</Label>
                                        <Textarea
                                            id="companyAddress"
                                            value={formData.companyAddress}
                                            onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                                            placeholder="Enter full company address"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="companyZipCode">Zip Code *</Label>
                                            <Input
                                                id="companyZipCode"
                                                value={formData.companyZipCode}
                                                onChange={(e) => handleInputChange('companyZipCode', e.target.value)}
                                                placeholder="Enter zip code"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="companyWebsite">Company Website *</Label>
                                            <Input
                                                id="companyWebsite"
                                                type="url"
                                                value={formData.companyWebsite}
                                                onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                                                placeholder="https://example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                                        <Zap className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-800 dark:text-green-200">
                                            <strong>Almost there!</strong> Just a few more details to complete your registration.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            {/* Step 3: Final Details */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="companyEmail">Company Email *</Label>
                                            <Input
                                                id="companyEmail"
                                                type="email"
                                                value={formData.companyEmail}
                                                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                                                placeholder="contact@company.com"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="companyPhone">Company Phone *</Label>
                                            <Input
                                                id="companyPhone"
                                                type="tel"
                                                value={formData.companyPhone}
                                                onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                                                placeholder="+1 (555) 123-4567"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-800 dark:text-green-200">
                                            <strong>Ready to go!</strong> Complete your registration to start tracking your carbon footprint.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={currentStep === 1 ? () => router.push('/login') : handlePrevious}
                                    disabled={isLoading}
                                >
                                    {currentStep === 1 ? "Back to Login" : "Previous"}
                                </Button>

                                <div className="flex items-center gap-2">
                                    {currentStep < totalSteps ? (
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={!isStepValid(currentStep)}
                                        >
                                            Next
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={isLoading || !isStepValid(currentStep)}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Registering...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Complete Registration
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
