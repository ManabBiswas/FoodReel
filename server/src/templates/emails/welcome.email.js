import { emailLayout } from './layout.js';

export const welcomeEmail = (userName, userEmail) => {
    const content = `
        <h2>Welcome to FoodReel, ${userName}!</h2>
        <p>We're thrilled to have you join our community of food lovers and discover amazing culinary experiences.</p>
        
        <p><strong>With FoodReel, you can:</strong></p>
        <ul>
            <li>Discover amazing restaurants near you</li>
            <li>Order your favorite meals with ease</li>
            <li>Share your culinary experiences</li>
            <li>Connect with fellow food enthusiasts</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/explore" class="button">
                Start Exploring
            </a>
        </div>

        <div class="divider"></div>
        
        <p style="font-size: 14px; color: #666;">Need help getting started? Check out our <a href="${process.env.FRONTEND_URL}/help">Help Center</a> or explore <a href="${process.env.FRONTEND_URL}/explore">trending restaurants</a>.</p>
        
        <p style="margin-top: 30px;">Happy eating!<br><strong>The FoodReel Team</strong></p>
    `;

    return {
        subject: `Welcome to FoodReel, ${userName}!`,
        html: emailLayout(content, 'Welcome to FoodReel'),
        text: `Welcome to FoodReel, ${userName}! We're excited to have you on board. Start exploring amazing restaurants at ${process.env.FRONTEND_URL}/explore`
    };
};