
export function setAboutPage(contentContainer) {
	contentContainer.innerHTML = `
<div class="about-view">
	<h2>About</h2>
	<p>Welcome to <strong>PongX</strong>, a project we created as a team of five developers during our studies at École 42. 
	The objective was to craft a dynamic and engaging single-page application (SPA) that offers a seamless user experience.</p>

	<p>The frontend is built with <strong>HTML, CSS, Bootstrap and JavaScript</strong>, delivering a responsive and user-friendly interface. The backend leverages the robust <strong>Django</strong> framework, ensuring a secure and scalable architecture.</p>

	<h3>Key Features</h3>

	<h4>Diverse Game Modes</h4>
	<ul>
		<li><strong>Local solo mode</strong> playing against AI with three difficulty levels.</li>
		<li><strong>Local versus mode</strong> for head-to-head matches.</li>
		<li><strong>Local tournament</strong> system supporting 3 to 16 players with automated bracketing.</li>
		<li><strong>Online private matches</strong> for challenging specific players.</li>
		<li><strong>Online quick matches</strong> for instant gameplay.</li>
	</ul>

	<h4>Social and Community Features</h4>
	<ul>
		<li><strong>Chat: WebSocket-powered Real-time Communication</strong>
			<ul>
				<li><strong>Private Chat Rooms:</strong> Users can chat directly with others by entering their usernames and raise duel requests in chat UI.</li>
				<li><strong>Public Chat Rooms:</strong> Open spaces where multiple users can join and do group chat by selecting room name.</li>
			</ul>
		</li>
		<li><strong>Social Media Features</strong>
			<ul>
				<li><strong>Friend management</strong> system with blocking functionality.</li>
				<li>View detailed user <strong>profiles</strong> and <strong>match history.</strong></li>
			</ul>
		</li>
		<li><strong>Competitive and Ranking System</strong>
			<ul>
				<li>MMR System: Matchmaking ensures fair competition.</li>
				<li>Leaderboard: Highlighting the best-ranked players for competitive spirit with periodic updates.</li>
			</ul>
		</li>
	</ul>

	<h4>Security Implementation</h4>
	<ul>
		<li><strong>Infrastructure Security</strong></li>
		<ul>
			<li><strong>HashiCorp Vault</strong> for secrets management and credential rotation.</li>
			<li><strong>ModSecurity WAF</strong> with OWASP Core Rule Set for attack prevention.</li>
			<li><strong>TLS</strong> encryption for all client-server communication.</li>
		</ul>
		<li><strong>Application Security</strong></li>
		<ul>
			<li><strong>JWT-based</strong> authentication with refresh token mechanism.</li>
			<li>Rate limiting and request validation.</li>
			<li>Input sanitization and XSS prevention.</li>
		</ul>
	</ul>

	<h4>DevOps & Monitoring</h4>
	<ul>
		<li><strong>Observability Stack</strong>
			<ul>
				<li>Setup <strong>ELK</strong> for operational logs management and analysis.</li>
				<li>Collected logs from both frontend and backend services and created dashboards visualization through <strong>Kibana</strong>.</li>
				<li>Defined data retention and archiving policies in <strong>Elasticsearch</strong> with Index Lifetime Management.</li>
				<li>Implemented <strong>TLS</strong> layers to data flow inside and outside ELK stack.</li>
			</ul>
		</li>
		<li><strong>Performance Monitoring</strong>
			<ul>
				<li>Setup for system metrics monitoring with alerting features.</li>
				<li>Collected metrics from backend and hardware performance from Docker environment with <strong>Prometheus</strong> and custom exporters.</li>
				<li>Automated alerting rules to proactively detect and respond to critical issues or anomalies.</li>
				<li><strong>Grafana</strong> dashboards for system visualization.</li>
				<li>Implemented <strong>TLS</strong> layers and authentication access control.</li>
			</ul>
		</li>
	</ul>

	<h4>Development Practices</h4>
	<ul>
		<li><strong>Docker</strong>-based containerization for consistent environments.</li>
		<li><strong>Unit-testing</strong> suite including WebSocket health checks and WAF functionality.</li>
		<li><strong>Git-based version control</strong> with branch protection.</li>
		<li><strong>CI/CD.</strong></li>
	</ul>

	<p><strong>Transcendence</strong> is the last project of the Common Core at Ecole 42. 
	We aimed to deliver a platform that is not only entertaining but also secure, competitive, and community-focused.</p>

	<h4 style="padding: 20px 0 0 0 !important;">Authors:</h4>
	<ul>
		<li><a href="https://github.com/Tsunghao-C" target="_blank">Tsunghao-C</a></li>
		<li><a href="https://github.com/Atwazar" target="_blank">Atwazar</a></li>
		<li><a href="https://github.com/Haliris" target="_blank">Haliris</a></li>
		<li><a href="https://github.com/BenjaminHThomas" target="_blank">BenjaminHThomas</a></li>
		<li><a href="https://github.com/asut00" target="_blank">asut00</a></li>
	</ul>
</div>
		`;
}
