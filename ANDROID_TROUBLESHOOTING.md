# حل مشاكل Android في MITConnect

## ⚠️ المشكلة: "Packager is not running at http://192.168.8.103:8082"

### 🔍 **أسباب المشكلة:**
1. **Metro bundler لا يعمل** على العنوان الصحيح
2. **مشكلة في الشبكة** بين الكمبيوتر والهاتف
3. **إعدادات IP غير صحيحة**
4. **Cache قديم** في التطبيق

### 🛠️ **الحلول:**

#### **الحل 1: إعادة تشغيل Metro bundler**
```bash
# إيقاف الخادم الحالي (Ctrl+C)
# ثم تشغيله من جديد
expo start --clear
```

#### **الحل 2: تغيير نوع الاتصال**
```bash
# تشغيل على localhost فقط
expo start --localhost

# أو تشغيل على tunnel
expo start --tunnel
```

#### **الحل 3: فحص إعدادات الشبكة**
1. تأكد أن الكمبيوتر والهاتف على نفس الشبكة
2. تحقق من عنوان IP للكمبيوتر:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```
3. استخدم العنوان الصحيح في التطبيق

#### **الحل 4: مسح Cache**
```bash
# مسح cache في التطبيق
expo start --clear

# أو إعادة تثبيت node_modules
rm -rf node_modules
npm install
```

#### **الحل 5: إعدادات Android**
1. افتح **Developer Options** في الهاتف
2. فعّل **USB Debugging**
3. فعّل **Allow USB Debugging**
4. اربط الهاتف بالكمبيوتر عبر USB

#### **الحل 6: استخدام Expo Go**
1. قم بتحميل **Expo Go** من Google Play
2. امسح QR code من الخادم
3. أو أدخل عنوان IP يدوياً

### 📱 **إعدادات التطبيق:**

#### **للمطورين:**
```bash
# تشغيل في وضع التطوير
expo start --dev-client

# تشغيل على منفذ محدد
expo start --port 8081
```

#### **للمستخدمين النهائيين:**
1. تأكد من تحديث التطبيق
2. أعد تشغيل التطبيق
3. تحقق من إعدادات الشبكة

### 🔧 **إعدادات الشبكة المتقدمة:**

#### **Windows:**
```bash
# فحص عنوان IP
ipconfig /all

# إعادة تعيين الشبكة
netsh winsock reset
```

#### **Mac/Linux:**
```bash
# فحص عنوان IP
ifconfig

# إعادة تشغيل الشبكة
sudo systemctl restart NetworkManager
```

### 📞 **إذا لم تحل المشكلة:**

1. **أعد تشغيل الكمبيوتر والهاتف**
2. **تحقق من إعدادات Firewall**
3. **جرب شبكة WiFi مختلفة**
4. **استخدم USB connection بدلاً من WiFi**

### 🆘 **للحصول على مساعدة:**
- تحقق من سجلات الأخطاء في وحدة تحكم المطور
- تأكد من إصدار Expo CLI: `expo --version`
- تحقق من إصدار Node.js: `node --version`

### ✅ **التحقق من الحل:**
بعد تطبيق الحلول، يجب أن:
1. يعمل Metro bundler بدون أخطاء
2. يظهر QR code في Terminal
3. يتصل التطبيق بالخادم بنجاح
4. تظهر الصور والمحتوى بشكل صحيح 