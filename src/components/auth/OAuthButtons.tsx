"use client";

import { Button } from "@components/ui";
import { type OAuthProvider, useAuth } from "@hooks/useAuth";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AppleIcon } from "./AppleIcon";
import { GoogleIcon } from "./GoogleIcon";

interface Provider {
  id: OAuthProvider;
  name: string;
  icon: React.ReactNode;
}

export function OAuthButtons() {
  const { t } = useTranslation("auth");
  const { signInWithOAuth } = useAuth();

  const providers: Provider[] = [
    {
      id: "google",
      name: "Google",
      icon: <GoogleIcon size={24} />,
    },
    {
      id: "apple",
      name: "Apple",
      icon: <AppleIcon size={24} />,
    },
  ];

  const getProviderLabel = (name: string) => {
    if (name === "Google") return t("common.googleButton");
    return t("common.appleButton");
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    try {
      await signInWithOAuth(provider);
    } catch (error) {
      console.error("Error signing in with OAuth provider:", error);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {providers.map((provider, index) => (
        <motion.div
          key={provider.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn(provider.id)}
            className="h-12 w-full gap-3 border-border/60 bg-background/50 backdrop-blur-sm hover:bg-background"
          >
            {provider.icon}
            <span className="font-medium">
              {getProviderLabel(provider.name)}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
