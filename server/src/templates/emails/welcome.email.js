import { emailLayout } from './layout.js';

export const welcomeEmail = (userName, userEmail) => {
    const content = `
        <h2 style="color:#2c3e50; font-family:Arial, sans-serif;">
            Welcome to FoodReel, ${userName}!
        </h2>
        
        <p style="font-size:16px; color:#444; line-height:1.6;">
            We're thrilled to have you join our vibrant community of food lovers. 
            Get ready to discover, share, and indulge in amazing culinary experiences!
        </p>
        
        <p style="font-weight:bold; margin-top:20px;">With FoodReel, you can:</p>
        <ul style="padding-left:20px; color:#555; line-height:1.6;">
            <li>Discover restaurants near you</li>
            <li>Order your favourite meals with ease</li>
            <li>Share your culinary experiences</li>
            <li>Connect with fellow food enthusiasts</li>
            <li>Partner with FoodReel as a food creator</li>
            <li>Attend exclusive food festivals</li>
        </ul>

        <p style="margin-top:20px; font-style:italic; color:#666;">
            Because you’re a foodie — and every taste bud matters.
        </p>

        <div style="text-align:center; margin:30px 0;">
            <a href="${process.env.FRONTEND_URL}/explore" 
               style="background:#ff7043; color:#fff; padding:12px 24px; 
                      border-radius:30px; text-decoration:none; font-weight:bold; 
                      box-shadow:0 4px 10px rgba(0,0,0,0.1); transition:0.3s;">
                Start Exploring
            </a>
        </div>

        <div class="divider"></div>
        
        <p style="font-size:14px; color:#777; line-height:1.6;">
            Need help getting started? Visit our 
            <a href="${process.env.FRONTEND_URL}/help" style="color:#ff7043;">Help Center</a> 
            or explore <a href="${process.env.FRONTEND_URL}/explore" style="color:#ff7043;">trending restaurants</a>.
        </p>
        
        <p style="margin-top:30px; color:#444;">
            Happy eating! <br>
            <strong>The FoodReel Team</strong>
        </p>
    `;

    return {
        subject: `Welcome to FoodReel, ${userName}!`,
        html: emailLayout(content, 'Welcome to FoodReel'),
        text: `Welcome to FoodReel, ${userName}! We're excited to have you on board. 
Discover restaurants, order meals, and share your foodie journey at ${process.env.FRONTEND_URL}/explore`
    };
};