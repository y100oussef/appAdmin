
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Database, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [configInput, setConfigInput] = useState("");
  const [isConfigVerified, setIsConfigVerified] = useState(false);
  const [configError, setConfigError] = useState("");
  const { signIn, updateFirebaseConfig } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Load saved Firebase config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem("firebaseConfig");
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.apiKey && config.projectId) {
          setIsConfigVerified(true);
        }
      } catch (error) {
        console.error("Error parsing saved Firebase config:", error);
      }
    }
  }, []);

  const extractFirebaseConfig = () => {
    try {
      // Reset previous errors
      setConfigError("");
      
      // Try to extract JSON format first
      try {
        const jsonConfig = JSON.parse(configInput);
        if (isValidFirebaseConfig(jsonConfig)) {
          processConfig(jsonConfig);
          return;
        }
      } catch { /* Not JSON, continue with text extraction */ }
      
      // Try to extract from text/code format
      const config = parseConfigFromText(configInput);
      
      if (isValidFirebaseConfig(config)) {
        processConfig(config);
      } else {
        setConfigError("تنسيق غير صالح. تأكد من نسخ تكوين Firebase كاملاً.");
      }
    } catch (error) {
      console.error("Error extracting Firebase config:", error);
      setConfigError("حدث خطأ أثناء استخراج الإعدادات");
    }
  };

  const parseConfigFromText = (text: string): FirebaseConfig => {
    const config: Partial<FirebaseConfig> = {};
    
    // Extract each property using regex
    const apiKeyMatch = text.match(/apiKey:\s*["'](.+?)["']/);
    const authDomainMatch = text.match(/authDomain:\s*["'](.+?)["']/);
    const databaseURLMatch = text.match(/databaseURL:\s*["'](.+?)["']/);
    const projectIdMatch = text.match(/projectId:\s*["'](.+?)["']/);
    const storageBucketMatch = text.match(/storageBucket:\s*["'](.+?)["']/);
    const messagingSenderIdMatch = text.match(/messagingSenderId:\s*["'](.+?)["']/);
    const appIdMatch = text.match(/appId:\s*["'](.+?)["']/);
    const measurementIdMatch = text.match(/measurementId:\s*["'](.+?)["']/);
    
    if (apiKeyMatch) config.apiKey = apiKeyMatch[1];
    if (authDomainMatch) config.authDomain = authDomainMatch[1];
    if (databaseURLMatch) config.databaseURL = databaseURLMatch[1];
    if (projectIdMatch) config.projectId = projectIdMatch[1];
    if (storageBucketMatch) config.storageBucket = storageBucketMatch[1];
    if (messagingSenderIdMatch) config.messagingSenderId = messagingSenderIdMatch[1];
    if (appIdMatch) config.appId = appIdMatch[1];
    if (measurementIdMatch) config.measurementId = measurementIdMatch[1];
    
    return config as FirebaseConfig;
  };

  const isValidFirebaseConfig = (config: any): config is FirebaseConfig => {
    return (
      config &&
      typeof config === 'object' &&
      typeof config.apiKey === 'string' &&
      typeof config.authDomain === 'string' &&
      typeof config.projectId === 'string' &&
      typeof config.storageBucket === 'string' &&
      typeof config.messagingSenderId === 'string' &&
      typeof config.appId === 'string'
    );
  };

  const processConfig = async (config: FirebaseConfig) => {
    try {
      setLoading(true);
      await updateFirebaseConfig(config);
      
      // Save to localStorage
      localStorage.setItem("firebaseConfig", JSON.stringify(config));
      
      setIsConfigVerified(true);
      toast({
        title: "تم التحقق من الإعدادات",
        description: "تم تحديث إعدادات Firebase بنجاح",
      });
    } catch (error) {
      console.error("Error updating Firebase config:", error);
      setConfigError("فشل التحقق من الإعدادات، تأكد من صحة المعلومات");
      setIsConfigVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfigVerified) {
      toast({
        title: "يجب التحقق من الإعدادات أولاً",
        description: "يرجى إدخال واستخراج إعدادات Firebase قبل تسجيل الدخول",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      await signIn(email, password);
      navigate("/");
    } catch (error) {
      console.error("Error during login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription>
            أدخل إعدادات Firebase وبيانات المدير للوصول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="configInput">إعدادات Firebase</Label>
                {isConfigVerified ? (
                  <span className="text-sm text-green-500 flex items-center gap-1">
                    <Check className="h-4 w-4" /> تم التحقق
                  </span>
                ) : null}
              </div>
              
              <Textarea
                id="configInput"
                placeholder="الصق إعدادات Firebase هنا..."
                value={configInput}
                onChange={(e) => setConfigInput(e.target.value)}
                className="h-24 font-mono text-xs"
              />
              
              {configError && (
                <div className="text-sm text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {configError}
                </div>
              )}
              
              <Button 
                type="button" 
                onClick={extractFirebaseConfig}
                variant="outline"
                className="mt-1 w-full gap-2"
                disabled={loading || !configInput.trim()}
              >
                <Database className="h-4 w-4" />
                استخراج وتحقق من الإعدادات
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  className="pr-10"
                  required
                  disabled={!isConfigVerified}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="pr-10"
                  required
                  disabled={!isConfigVerified}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isConfigVerified}
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
