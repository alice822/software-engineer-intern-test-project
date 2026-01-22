# Architecture Overview
- Frontend: React/Next.js
- Backend: Firebase Functions (if any) / Firebase Hosting
- Storage: Firebase Storage for uploaded images
- Flow: User uploads → Image processed → Auto-crop applied → Display result

# Auto-Crop Algorithm
1. Load uploaded image
2. Detect main content using edge detection / bounding box
3. Calculate crop area (top, bottom, left, right)
4. Crop image and resize if needed
5. Save/display processed image

# Setup Instructions
1. Clone repo:
   git clone https://github.com/your-username/auto-crop-app.git
2. Install dependencies:
   npm install
3. Create `.env.local` (if needed) and add Firebase config
4. Start dev server:
   npm run dev
5. Build & deploy:
   npm run build
   firebase deploy
# Libraries
- React (MIT)
- Next.js (MIT)
- Firebase (Apache 2.0)
- OpenCV.js (Apache 2.0)
# Trade-offs
- Current auto-crop may fail on complex backgrounds
- Uses client-side processing → performance may vary

# Improvements
- Use ML-based object detection for precise cropping
- Move processing to serverless backend for faster performance
- Add multiple file format support
