import PropTypes from 'prop-types';
import { Component } from 'react';
import ConversationPostList from 'calypso/blocks/conversations/list';
import CompactPostCard from 'calypso/blocks/reader-post-card/compact';

class ConversationPost extends Component {
	static propTypes = {
		post: PropTypes.object.isRequired,
		commentIds: PropTypes.array.isRequired,
	};

	render() {
		return (
			<div className="reader-post-card__conversation-post">
				<CompactPostCard { ...this.props } />
				<ConversationPostList
					post={ this.props.post }
					commentIds={ this.props.commentIds }
					filterParents={ false }
				/>
			</div>
		);
	}
}

export default ConversationPost;
