"use client";
import { useState, useRef, useEffect } from "react";
import {
  useCurrentUser,
  useLinkGoogle,
  useLinkApple,
  useLinkEmail,
  useVerifyEmailOTP,
  useLinkSms,
  useVerifySmsOTP,
} from "@coinbase/cdp-hooks";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, Mail, AlertCircle, Loader2, X, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import XIcon from "@/lib/icons/x-icon";
import { OTPDialog } from "@/components/otp-dialog";
import { profileApi } from "@/lib/api/profile";

export default function ProfilePage() {
  const { currentUser } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CDP Linking Hooks
  const { linkGoogle, oauthState: googleOAuthState } = useLinkGoogle();
  const { linkApple, oauthState: appleOAuthState } = useLinkApple();
  const { linkEmail } = useLinkEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { linkSms } = useLinkSms();
  const { verifySmsOTP } = useVerifySmsOTP();

  // Get authentication methods from CDP
  const xAuth = currentUser?.authenticationMethods?.x;
  const googleAuth = currentUser?.authenticationMethods?.google;
  const appleAuth = currentUser?.authenticationMethods?.apple;
  const emailAuth = currentUser?.authenticationMethods?.email;
  const smsAuth = currentUser?.authenticationMethods?.sms;

  const xUsername = xAuth?.username;
  const googleEmail = googleAuth?.email;
  const appleEmail = appleAuth?.email;
  const linkedEmail = emailAuth?.email;
  const linkedPhone = smsAuth?.phoneNumber;

  // Form state
  const [profileImage, setProfileImage] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Linking state
  const [emailFlowId, setEmailFlowId] = useState("");
  const [phoneFlowId, setPhoneFlowId] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailToLink, setEmailToLink] = useState("");
  const [phoneToLink, setPhoneToLink] = useState("");
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [linkingStatus, setLinkingStatus] = useState<{
    email?: string;
    phone?: string;
    google?: string;
    apple?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load existing profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!xUsername) return; // Wait for X username to be available
      
      try {
        const profile = await profileApi.getProfile(xUsername);
        if (profile) {
          setName(profile.name || "");
          setDescription(profile.description || "");
          // Note: profileImage would need to be stored separately or in a different field
        }
      } catch (error) {
        // Profile doesn't exist yet, which is fine
        if (error instanceof Error && error.message !== "Profile not found") {
          console.error("Error loading profile:", error);
        }
      }
    };

    loadProfile();
  }, [xUsername]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Link Google Account
  const handleLinkGoogle = async () => {
    if (!currentUser) {
      console.error("User must be signed in first");
      return;
    }
    try {
      setLinkingStatus((prev) => ({ ...prev, google: "linking" }));
      await linkGoogle();
      setLinkingStatus((prev) => ({ ...prev, google: "success" }));
    } catch (error) {
      console.error("Failed to link Google account:", error);
      setLinkingStatus((prev) => ({ ...prev, google: "error" }));
    }
  };

  // Link Apple Account
  const handleLinkApple = async () => {
    if (!currentUser) {
      console.error("User must be signed in first");
      return;
    }
    try {
      setLinkingStatus((prev) => ({ ...prev, apple: "linking" }));
      await linkApple();
      setLinkingStatus((prev) => ({ ...prev, apple: "success" }));
    } catch (error) {
      console.error("Failed to link Apple account:", error);
      setLinkingStatus((prev) => ({ ...prev, apple: "error" }));
    }
  };

  // Link Email - Step 1: Initiate
  const handleLinkEmail = async () => {
    if (!currentUser || !emailToLink) {
      console.error("User must be signed in and email must be provided");
      return;
    }
    try {
      setLinkingStatus((prev) => ({ ...prev, email: "linking" }));
      const result = await linkEmail(emailToLink);
      setEmailFlowId(result.flowId);
      setShowEmailOtp(true);
      setLinkingStatus((prev) => ({ ...prev, email: "otp_sent" }));
    } catch (error) {
      console.error("Failed to initiate email linking:", error);
      setLinkingStatus((prev) => ({ ...prev, email: "error" }));
    }
  };

  // Link Email - Step 2: Verify OTP
  const handleVerifyEmailOtp = async () => {
    if (!emailFlowId || !emailOtp) return;
    try {
      setLinkingStatus((prev) => ({ ...prev, email: "verifying" }));
      await verifyEmailOTP({ flowId: emailFlowId, otp: emailOtp });
      setLinkingStatus((prev) => ({ ...prev, email: "success" }));
      setShowEmailOtp(false);
      setShowEmailInput(false);
      setEmailOtp("");
      setEmailToLink("");
      // Show success message briefly
      setTimeout(() => {
        setLinkingStatus((prev) => ({ ...prev, email: undefined }));
      }, 3000);
    } catch (error) {
      console.error("Failed to verify email OTP:", error);
      setLinkingStatus((prev) => ({ ...prev, email: "error" }));
    }
  };

  // Link Phone - Step 1: Initiate
  const handleLinkPhone = async () => {
    if (!currentUser || !phoneToLink) {
      console.error("User must be signed in and phone must be provided");
      return;
    }
    try {
      setLinkingStatus((prev) => ({ ...prev, phone: "linking" }));
      const result = await linkSms(phoneToLink);
      setPhoneFlowId(result.flowId);
      setShowPhoneOtp(true);
      setLinkingStatus((prev) => ({ ...prev, phone: "otp_sent" }));
    } catch (error) {
      console.error("Failed to initiate phone linking:", error);
      setLinkingStatus((prev) => ({ ...prev, phone: "error" }));
    }
  };

  // Link Phone - Step 2: Verify OTP
  const handleVerifyPhoneOtp = async () => {
    if (!phoneFlowId || !phoneOtp) return;
    try {
      setLinkingStatus((prev) => ({ ...prev, phone: "verifying" }));
      await verifySmsOTP({ flowId: phoneFlowId, otp: phoneOtp });
      setLinkingStatus((prev) => ({ ...prev, phone: "success" }));
      setShowPhoneOtp(false);
      setShowPhoneInput(false);
      setPhoneOtp("");
      setPhoneToLink("");
      // Show success message briefly
      setTimeout(() => {
        setLinkingStatus((prev) => ({ ...prev, phone: undefined }));
      }, 3000);
    } catch (error) {
      console.error("Failed to verify phone OTP:", error);
      setLinkingStatus((prev) => ({ ...prev, phone: "error" }));
    }
  };

  // Note: CDP doesn't provide built-in unlink hooks, so we'll show a message
  const handleDisconnect = (method: string) => {
    alert(
      `To disconnect your ${method} account, please visit your Coinbase Developer Platform account settings. Linked authentication methods help with account recovery and security.`
    );
  };

  const handleSave = async () => {
    if (!currentUser) {
      setSaveMessage({ type: "error", text: "You must be signed in to save your profile" });
      return;
    }

    // Get user ID from CDP user (use X username as primary identifier)
    const userId = xUsername || "";
    
    if (!userId) {
      setSaveMessage({ type: "error", text: "Unable to identify user. Please ensure you're logged in with X/Twitter." });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await profileApi.createOrUpdateProfile({
        user_id: userId,
        name: name || undefined,
        description: description || undefined,
        x_username: xUsername || undefined,
        agent_id: null, // Will be set when mirror option is enabled
      });

      setSaveMessage({ type: "success", text: "Profile saved successfully!" });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to save profile. Please try again." 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start w-full h-full">
      <div className="bg-white text-secondary backdrop-blur-sm rounded-2xl md:p-8 p-4 max-w-3xl w-full shadow-lg h-full min-h-[400px] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-row items-start justify-between gap-2 w-full mb-8">
          <h1 className="text-4xl font-bold">Profile</h1>
          {xUsername && (
            <Link target="_blank" href={`https://x.com/${xUsername}`} className="text-sm bg-secondary text-white px-4 py-2 rounded-full flex items-center gap-2">
              <XIcon className="w-4 h-4" /> {xUsername}
            </Link>
          )}
        </div>

        {/* Profile Image Upload */}
        <div className="flex flex-col items-center gap-4 mb-4 md:mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-secondary/10 border-4 border-secondary/20 overflow-hidden flex items-center justify-center">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-12 h-12 text-secondary/40" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-secondary text-white p-2 rounded-full hover:bg-secondary/90 transition-colors shadow-lg"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <p className="text-sm text-muted">Click to upload profile picture</p>
        </div>

        {/* Profile Form */}
        <div className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell us about yourself..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>


    

          {/* Connections */}
          <div className="space-y-4">
            <div className="flex flex-col items-start justify-start gap-2">
              <Label>Connections</Label>
              <p className="text-xs text-gray-500">
                Link additional accounts for enhanced features
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {/* Email Connection */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Mail className="w-5 h-5 shrink-0 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Email</p>
                    {linkedEmail ? (
                      <p className="text-xs text-gray-600 truncate">
                        {linkedEmail}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Not connected</p>
                    )}
                  </div>
                </div>
                {linkedEmail ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect("Email")}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : !showEmailInput ? (
                  <Button
                    size="sm"
                    onClick={() => setShowEmailInput(true)}
                    variant="outline"
                  >
                    Link
                  </Button>
                ) : null}
              </div>
              {showEmailInput && !linkedEmail && (
                <div className="pl-4 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={emailToLink}
                      onChange={(e) => setEmailToLink(e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={handleLinkEmail}
                      disabled={!emailToLink || linkingStatus.email === "linking"}
                    >
                      {linkingStatus.email === "linking" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowEmailInput(false);
                        setEmailToLink("");
                        setLinkingStatus((prev) => ({ ...prev, email: undefined }));
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {linkingStatus.email === "success" && (
                    <p className="text-xs text-green-600">
                      ✓ Email linked successfully!
                    </p>
                  )}
                  {linkingStatus.email === "error" && (
                    <p className="text-xs text-red-600">
                      Failed to link email. Please try again.
                    </p>
                  )}
                </div>
              )}

              {/* Phone Connection */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Phone className="w-5 h-5 shrink-0 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Phone</p>
                    {linkedPhone ? (
                      <p className="text-xs text-gray-600 truncate">
                        {linkedPhone}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Not connected</p>
                    )}
                  </div>
                </div>
                {linkedPhone ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect("Phone")}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : !showPhoneInput ? (
                  <Button
                    size="sm"
                    onClick={() => setShowPhoneInput(true)}
                    variant="outline"
                  >
                    Link
                  </Button>
                ) : null}
              </div>
              {showPhoneInput && !linkedPhone && (
                <div className="pl-4 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phoneToLink}
                      onChange={(e) => setPhoneToLink(e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={handleLinkPhone}
                      disabled={!phoneToLink || linkingStatus.phone === "linking"}
                    >
                      {linkingStatus.phone === "linking" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowPhoneInput(false);
                        setPhoneToLink("");
                        setLinkingStatus((prev) => ({ ...prev, phone: undefined }));
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {linkingStatus.phone === "success" && (
                    <p className="text-xs text-green-600">
                      ✓ Phone number linked successfully!
                    </p>
                  )}
                  {linkingStatus.phone === "error" && (
                    <p className="text-xs text-red-600">
                      Failed to link phone. Please try again.
                    </p>
                  )}
                </div>
              )}

              {/* Google Connection */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Mail className="w-5 h-5 shrink-0 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Google</p>
                    {googleEmail ? (
                      <p className="text-xs text-gray-600 truncate">
                        {googleEmail}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Not connected</p>
                    )}
                  </div>
                </div>
                {googleAuth ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect("Google")}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleLinkGoogle}
                    disabled={
                      googleOAuthState?.status === "pending" ||
                      linkingStatus.google === "linking"
                    }
                    variant="outline"
                  >
                    {linkingStatus.google === "linking" ||
                    googleOAuthState?.status === "pending" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Link"
                    )}
                  </Button>
                )}
              </div>

              {/* Apple Connection */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <svg
                    className="w-5 h-5 shrink-0 text-gray-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Apple</p>
                    {appleEmail ? (
                      <p className="text-xs text-gray-600 truncate">
                        {appleEmail}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Not connected</p>
                    )}
                  </div>
                </div>
                {appleAuth ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect("Apple")}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleLinkApple}
                    disabled={
                      appleOAuthState?.status === "pending" ||
                      linkingStatus.apple === "linking"
                    }
                    variant="outline"
                  >
                    {linkingStatus.apple === "linking" ||
                    appleOAuthState?.status === "pending" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Link"
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Linking additional accounts helps verify your identity and enables enhanced features. All accounts remain connected to your Twitter login.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="space-y-2">
            {saveMessage && (
              <div
                className={`p-3 rounded-md text-sm ${
                  saveMessage.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {saveMessage.text}
              </div>
            )}
            <button
              className="w-full h-12 text-base font-semibold bg-secondary text-white hover:bg-secondary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Email OTP Dialog */}
      <OTPDialog
        open={showEmailOtp}
        onOpenChange={setShowEmailOtp}
        title="Verify Email"
        description={`Enter the 6-digit code sent to ${emailToLink}`}
        value={emailOtp}
        onChange={setEmailOtp}
        onVerify={handleVerifyEmailOtp}
        isVerifying={linkingStatus.email === "verifying"}
        error={linkingStatus.email === "error" ? "Invalid code. Please try again." : undefined}
        maxLength={6}
      />

      {/* Phone OTP Dialog */}
      <OTPDialog
        open={showPhoneOtp}
        onOpenChange={setShowPhoneOtp}
        title="Verify Phone"
        description={`Enter the 6-digit code sent to ${phoneToLink}`}
        value={phoneOtp}
        onChange={setPhoneOtp}
        onVerify={handleVerifyPhoneOtp}
        isVerifying={linkingStatus.phone === "verifying"}
        error={linkingStatus.phone === "error" ? "Invalid code. Please try again." : undefined}
        maxLength={6}
      />
    </div>
  );
}
