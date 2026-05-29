import { useParams } from "react-router-dom";
import { teamMembers } from "../template/TeamData";
import AboutCard from "../template/AboutCard";

function About() {
    const { slug } = useParams();

    const member = teamMembers.find(
        (m) => m.slug === slug
    );

    if (!member) {
        return <h2>Member not found</h2>;
    }

    return (
        <AboutCard
            name={member.name}
            imageSrc={member.imageSrc}
            role={member.role}
            bio={member.bio}
            />
    );
}

export default About;